import fs from 'node:fs/promises';
import { join } from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';

import { extractRepositoryUrl } from '@paklo/core/azure';
import { getDependabotConfig } from '@paklo/core/azure/config';
import { DEFAULT_EXPERIMENTS, DependabotJobBuilder, parseExperiments } from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { Command, Option } from 'commander';
import { z } from 'zod';

import { type HandlerOptions, handlerOptions } from '../base';

const schema = z.object({
  provider: z.enum(['azure']),
  repositoryUrl: z.url(),
  gitToken: z.string(),
  githubToken: z.string().optional(),
  targetUpdateIds: z.coerce.number().array(),
  experiments: z.string().optional(),
  outDir: z.string(),
  debug: z.boolean(),
});

type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const {
    provider,
    repositoryUrl,
    gitToken,
    githubToken,
    targetUpdateIds,
    experiments: rawExperiments,
    outDir,
    debug,
  } = options;

  if (provider !== 'azure') {
    error(`Unsupported provider: '${provider}'. Currently only 'azure' is supported.`);
    return;
  }

  // Convert experiments from comma separated key value pairs to a record.
  // If no experiments are defined, use the default experiments.
  let experiments = parseExperiments(rawExperiments);
  if (!experiments) {
    experiments = DEFAULT_EXPERIMENTS;
    logger.debug('No experiments provided; Using default experiments.');
  }
  logger.debug(`Experiments: ${JSON.stringify(experiments)}`);

  // extract url parts
  const url = extractRepositoryUrl({ repositoryUrl });

  // prepare to find variables from env or by asking user for input
  const variables = new Map<string, string>();
  const rl = readline.createInterface({ input: stdin, output: stdout });
  async function variableFinder(name: string) {
    // first, check cache
    if (variables.has(name)) return variables.get(name);

    // second, check environment
    let value = process.env[name];
    if (value) {
      logger.trace(`Found value for variable named: ${name} in environment`);
      variables.set(name, value);
      return value;
    }

    // finally, ask user
    logger.trace(`Asking value for variable named: ${name}`);
    value = await rl.question(`Please provide the value for '${name}': `);
    variables.set(name, value);
    return value;
  }

  // Parse dependabot configuration file
  const config = await getDependabotConfig({
    url,
    token: gitToken,
    remote: true, // not supporting local mode in CLI yet
    variableFinder,
  });
  rl.close();
  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );

  // Determine which updates to generate configs for
  let updates = config.updates;
  if (targetUpdateIds && targetUpdateIds.length > 0) {
    updates = [];
    for (const id of targetUpdateIds) {
      const upd = config.updates[id];
      if (!upd) {
        logger.warn(`Unable to find target update id '${id}'. Expected range: 0-${config.updates.length - 1}`);
      } else {
        updates.push(upd);
      }
    }
  }

  let generated = 0;
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i]!;

    // Skip security-only updates (open-pull-requests-limit: 0).
    // These require vulnerability discovery at run time, so a static config cannot be generated.
    if (update['open-pull-requests-limit'] === 0) {
      logger.info(
        `Skipping security-only update ${i} (${update['package-ecosystem']}): open-pull-requests-limit is 0.`,
      );
      continue;
    }

    const builder = new DependabotJobBuilder({
      experiments,
      source: {
        provider: 'azure',
        ...url,
        // replacing hostname with host to ensure we capture port if specified
        // this mostly applies to Azure DevOps Server on-premises instances
        // where the URL often includes a port number,
        // e.g. `https://on.prem.com:8080/contoso`
        // the api-endpoint already has it
        hostname: url.host,
      },
      config,
      update,
      systemAccessToken: gitToken,
      githubToken,
      debug,
    });

    const { job, credentials } = builder.forUpdate({
      id: String(i),
      command: 'update',
      existingPullRequests: [],
    });

    const dir = join(outDir, String(i));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, 'job.json'), JSON.stringify(job, null, 2), 'utf-8');
    // The CA certificate is generated at runtime by the proxy; omit it here.
    await fs.writeFile(
      join(dir, 'proxy-config.json'),
      JSON.stringify({ all_credentials: credentials }, null, 2),
      'utf-8',
    );

    logger.info(`Generated configs for update ${i} (${update['package-ecosystem']}) → ${dir}`);
    generated++;
  }

  logger.info(`Generated ${generated} job config(s) in '${outDir}'.`);
}

export const command = new Command('generate')
  .description('Generate job config files for each update entry in a repository.')
  .addOption(
    new Option('--provider <PROVIDER>', "Repository provider. Currently only ('azure') Azure DevOps is supported.")
      .choices(['azure'])
      .makeOptionMandatory(),
  )
  .requiredOption(
    '--repository-url <REPOSITORY-URL>',
    'Full URL of the Azure DevOps repository. Examples: https://dev.azure.com/my-org/project/_git/repo, https://my-org.visualstudio.com/project/_git/repo, http://my-org.com:8443/tfs/org/project/_git/repo',
  )
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .option(
    '--github-token <GITHUB-TOKEN>',
    'GitHub token to use for authentication. If not specified, you may get rate limited.',
  )
  .option('--target-update-ids <TARGET-UPDATE-IDS...>', 'List of target update IDs to generate configs for.', [])
  .option(
    '--experiments <EXPERIMENTS>',
    'Comma-separated list of experiments to enable. If not set, default experiments will be used.',
  )
  .option('--out-dir <OUT-DIR>', 'Directory to write the generated job config files to.', './job-configs')
  .option('--debug', 'Whether to enable debug logging.', false)
  .action(
    async (...args) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            ...args[0],
          },
          command: args.at(-1),
        }),
      ),
  );
