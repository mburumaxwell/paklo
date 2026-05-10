import { AzureDevOpsClientWrapper, getPullRequestMetadata } from '@paklo/core/azure/client';
import type { DependabotPullRequestMetadata } from '@paklo/core/dependabot';
import * as tl from 'azure-pipelines-task-lib/task';

import { setupLogging } from '../common';
import { getTaskInputs } from './inputs';

const outputVariableNames: Record<keyof DependabotPullRequestMetadata, string> = {
  'dependency-names': 'dependencyNames',
  'dependency-type': 'dependencyType',
  'update-type': 'updateType',
  'updated-dependencies-json': 'updatedDependenciesJson',
  'directory': 'directory',
  'package-ecosystem': 'packageEcosystem',
  'target-branch': 'targetBranch',
  'previous-version': 'previousVersion',
  'new-version': 'newVersion',
  'compatibility-score': 'compatibilityScore',
  'maintainer-changes': 'maintainerChanges',
  'dependency-group': 'dependencyGroup',
  'alert-state': 'alertState',
  'ghsa-id': 'ghsaId',
  'cvss': 'cvss',
};

async function run() {
  try {
    // Parse task input configuration
    const inputs = getTaskInputs();
    if (!inputs) {
      throw new Error('Failed to parse task input configuration');
    }

    // Route core logs through Azure DevOps task output.
    setupLogging(inputs);

    const { url, pullRequestId, systemAccessToken } = inputs;
    const client = new AzureDevOpsClientWrapper(url, systemAccessToken);

    // ensure the pull request exists
    const pullRequest = await client.inner.pullRequests.get(url.project, url.repository, pullRequestId);
    if (!pullRequest) {
      throw new Error(`Pull request '${pullRequestId}' was not found.`);
    }

    // fetch the pull request properties
    const properties = await client.inner.pullRequests.getProperties(url.project, url.repository, pullRequestId);
    if (!properties) {
      throw new Error(`Properties for pull request '${pullRequestId}' were not found.`);
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

    for (const [name, value] of Object.entries(metadata)) {
      const varValue = typeof value === 'object' ? JSON.stringify(value) : (value?.toString() ?? '');
      tl.setVariable(outputVariableNames[name as keyof DependabotPullRequestMetadata], varValue, false, true);
    }

    tl.setResult(tl.TaskResult.Succeeded, 'Dependabot pull request metadata fetched successfully.');
  } catch (e) {
    const err = e as Error;
    tl.setResult(tl.TaskResult.Failed, err.message);
    tl.error(`An unhandled exception occurred: ${e}`);
    console.debug(e);
  }
}

run();
