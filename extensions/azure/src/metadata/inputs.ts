import { type AzureDevOpsRepositoryUrl, extractRepositoryUrl } from '@paklo/core/azure';
import * as tl from 'azure-pipelines-task-lib/task';

import { getAzureDevOpsAccessToken, setSecrets } from '../common';

export type TaskInputs = {
  url: AzureDevOpsRepositoryUrl;

  /** The access token for Azure DevOps Repos */
  systemAccessToken: string;

  /** Determines if verbose log messages are logged */
  debug: boolean;
  /** Determines if secrets are protected */
  secrets: boolean;

  /** The ID of the pull request to fetch metadata for */
  pullRequestId: number;
};

/** Extract task inputs (a.k.a. shared variables). */
export function getTaskInputs(): TaskInputs {
  const project = tl.getVariable('System.TeamProject')!;
  const repository = tl.getVariable('Build.Repository.Name')!;
  const organizationUrl = tl.getVariable('System.TeamFoundationCollectionUri')!;
  const url = extractRepositoryUrl({ organizationUrl, project, repository });

  // Prepare the access credentials
  const systemAccessToken = getAzureDevOpsAccessToken();

  const debug: boolean = Boolean(tl.getVariable('System.Debug')?.match(/true/i));
  const secrets: boolean = Boolean(tl.getVariable('System.Secrets')?.match(/true/i));

  const rawPullRequestId = tl.getVariable('System.PullRequest.PullRequestId');
  if (!rawPullRequestId) {
    throw new Error(
      'Pull request ID is not available in the environment variables. Ensure this task is running in the context of a pull request.',
    );
  }
  const pullRequestId = Number(rawPullRequestId);
  if (!Number.isInteger(pullRequestId) || pullRequestId <= 0) {
    throw new Error(`Pull request ID '${rawPullRequestId}' is not a valid pull request ID.`);
  }

  const inputs: TaskInputs = {
    url,

    systemAccessToken,

    debug,
    secrets,

    pullRequestId,
  };

  // Mask environment, organization, and project specific variables from the logs.
  // Most user's environments are private and they're less likely to share diagnostic info when it exposes information about their environment or organization.
  // Although not exhaustive, this will mask the most common information that could be used to identify the user's environment.
  if (inputs.secrets) {
    setSecrets(inputs.url.hostname, inputs.url.project, inputs.url.repository, inputs.systemAccessToken);
  }

  return inputs;
}
