import { stdout } from 'node:process';

import { extractRepositoryUrl } from '@paklo/core/azure';
import { AzureDevOpsClientWrapper, getPullRequestMetadata } from '@paklo/core/azure/client';
import { Command, Option } from 'commander';
import { z } from 'zod';

import { type HandlerOptions, handlerOptions } from '../base';

const schema = z.object({
  provider: z.enum(['azure']),
  repositoryUrl: z.url(),
  gitToken: z.string(),
  pullRequestId: z.coerce.number().int().positive(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const { provider, repositoryUrl, gitToken, pullRequestId } = options;
  if (provider !== 'azure') {
    error(`Unsupported provider: '${provider}'. Currently only 'azure' is supported.`);
    return;
  }

  const url = extractRepositoryUrl({ repositoryUrl });
  const client = new AzureDevOpsClientWrapper(url, gitToken);

  try {
    // ensure the pull request exists
    const pullRequest = await client.inner.pullRequests.get(url.project, url.repository, pullRequestId);
    if (!pullRequest) {
      error({ message: `Pull request '${pullRequestId}' was not found.`, exitCode: 1 });
      return;
    }

    // fetch the pull request properties
    const properties = await client.inner.pullRequests.getProperties(url.project, url.repository, pullRequestId);
    if (!properties) {
      error({ message: `Properties for pull request '${pullRequestId}' were not found.`, exitCode: 1 });
      return;
    }

    const commits = await client.inner.pullRequests.getCommits(url.project, url.repository, pullRequestId);
    const firstCommit = commits?.[0]?.commitId
      ? await client.inner.git.getCommit(url.project, url.repository, commits[0].commitId)
      : undefined;
    const metadata = await getPullRequestMetadata({
      pullRequestId,
      properties,
      description: pullRequest.description,
      targetRefName: pullRequest.targetRefName,
      commitMessage: firstCommit?.comment ?? commits?.[0]?.comment,
    });

    stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
  } catch (err) {
    error({ message: (err as Error).message, exitCode: 1 });
  }
}

export const command = new Command('fetch-metadata')
  .description('Fetch metadata for a Dependabot pull request.')
  .addOption(
    new Option('--provider <PROVIDER>', "Repository provider. Currently only ('azure') Azure DevOps is supported.")
      .choices(['azure'])
      .makeOptionMandatory(),
  )
  .requiredOption(
    '--repository-url <REPOSITORY-URL>',
    'Full URL of the Azure DevOps repository. Examples: https://dev.azure.com/my-org/project/_git/repo, https://my-org.visualstudio.com/project/_git/repo, https://my-org.com:8443/tfs/org/project/_git/repo',
  )
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .requiredOption('--pull-request-id <PULL-REQUEST-ID>', 'Pull request ID to fetch metadata for.')
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
