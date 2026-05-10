import {
  type CompatibilityScoreLookup,
  type DependabotPullRequestMetadata,
  extractPullRequestMetadata,
  normalizeBranchName,
} from '@/dependabot';

import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES } from './constants';
import type { AzdoPrExtractedWithProperties } from './types';
import { getPullRequestPackageManagers, parsePullRequestProps } from './utils';

export type DependabotPullRequestMetadataInput = AzdoPrExtractedWithProperties & {
  description?: string | null;
  targetRefName?: string | null;
  commitMessage?: string | null;
};

export async function getPullRequestMetadata(
  input: DependabotPullRequestMetadataInput,
  scoreLookup?: CompatibilityScoreLookup,
): Promise<DependabotPullRequestMetadata> {
  const hasDependencies = input.properties?.some((property) => property.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES);
  const packageManagers = getPullRequestPackageManagers(input);
  if (!hasDependencies || packageManagers.length === 0) {
    throw new Error(`No Dependabot metadata was found on pull request '${input.pullRequestId}'.`);
  }

  const parsed = parsePullRequestProps(input);
  const targetBranch = normalizeBranchName(input.targetRefName ?? undefined) ?? '';

  return await extractPullRequestMetadata(
    input.description,
    parsed,
    packageManagers,
    targetBranch,
    scoreLookup,
    input.commitMessage,
  );
}
