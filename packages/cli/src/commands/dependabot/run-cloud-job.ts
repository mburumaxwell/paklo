import { DependabotPackageManagerSchema, DependabotSourceProviderSchema } from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { runJob } from '@paklo/core/runner';
import { Command, Option } from 'commander';
import { z } from 'zod';

import { type HandlerOptions, handlerOptions } from '../base';

const schema = z.object({
  jobId: z.string().min(1),
  token: z.string().min(1),
  credentialsToken: z.string().min(1),
  apiUrl: z.url(),
  apiDockerUrl: z.url().optional(),
  updaterImage: z.string().optional(),
  provider: DependabotSourceProviderSchema,
  owner: z.url(),
  project: z.url(),
  packageManager: DependabotPackageManagerSchema,
  debug: z.boolean().default(false),
});

type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const {
    jobId,
    token,
    credentialsToken,
    apiUrl,
    apiDockerUrl,
    updaterImage,
    provider,
    owner,
    project,
    packageManager,
    debug,
  } = options;

  const result = await runJob({
    dependabotApiUrl: apiUrl,
    dependabotApiDockerUrl: apiDockerUrl,
    jobId,
    jobToken: token,
    credentialsToken,
    updaterImage,
    secretMasker(_secret: string) {},
    debug,
    usage: {
      'trigger': 'service',
      provider,
      owner,
      project,
      'package-manager': packageManager,
    },
  });

  if (!result.success) {
    error({ message: result.message, exitCode: 1, code: 'paklo.dependabot.run_cloud_job.failed' });
    return;
  }

  logger.info(`Cloud job '${jobId}' completed successfully.`);
}

export const command = new Command('run-cloud-job')
  .description('Run a job from the Paklo cloud.')
  .requiredOption('--job-id <id>', 'Job identifier.')
  .requiredOption('--token <token>', 'Job token.')
  .requiredOption('--credentials-token <token>', 'Credentials token.')
  .requiredOption('--api-url <url>', 'Paklo API base URL.')
  .option('--api-docker-url <url>', 'API URL reachable from inside Docker containers. Defaults to --api-url.')
  .option('--updater-image <image>', 'Updater image override.')
  .addOption(
    new Option('--provider <provider>', 'Repository provider.')
      .choices(DependabotSourceProviderSchema.options)
      .makeOptionMandatory(),
  )
  .requiredOption('--owner <url>', 'Organisation URL.')
  .requiredOption('--project <url>', 'Project URL.')
  .addOption(
    new Option('--package-manager <package-manager>', 'Package manager.')
      .choices(DependabotPackageManagerSchema.options)
      .makeOptionMandatory(),
  )
  .option('--debug', 'Enable debug mode.', false)
  .action(
    async (...args) =>
      await handler(
        await handlerOptions({
          schema,
          input: { ...args[0] },
          command: args.at(-1),
        }),
      ),
  );
