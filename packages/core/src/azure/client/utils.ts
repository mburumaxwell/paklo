import * as path from 'node:path';

import {
  type DependabotCreatePullRequest,
  type DependabotExistingGroupPr,
  type DependabotExistingPr,
  type DependabotPackageManager,
  DependabotPackageManagerSchema,
  type DependabotPersistedPr,
  DependabotPersistedPrSchema,
  type DependabotUpdatePullRequest,
  areEqual,
  getDependencyNames,
} from '@/dependabot';

import {
  PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
  PR_PROPERTY_DEPENDABOT_MULTI_ECOSYSTEM_GROUP_NAME,
  PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS,
} from './constants';
import type { AzdoFileChange, AzdoPrExtractedWithProperties, AzdoVersionControlChangeType } from './types';

export function buildPullRequestProperties(
  packageManager: DependabotPackageManager | DependabotPackageManager[],
  dependencies: DependabotPersistedPr,
  multiEcosystemGroupName?: string,
) {
  const packageManagers = [...new Set(Array.isArray(packageManager) ? packageManager : [packageManager])];

  return [
    { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS, value: JSON.stringify(packageManagers) },
    ...(multiEcosystemGroupName
      ? [{ name: PR_PROPERTY_DEPENDABOT_MULTI_ECOSYSTEM_GROUP_NAME, value: multiEcosystemGroupName }]
      : []),
    { name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES, value: JSON.stringify(dependencies) },
  ];
}

export function parsePullRequestProps(
  pr: AzdoPrExtractedWithProperties,
): DependabotExistingPr | DependabotExistingGroupPr {
  const parsed = DependabotPersistedPrSchema.parse(
    JSON.parse(pr.properties!.find((p) => p.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES)!.value),
  );

  return { 'pr-number': pr.pullRequestId, ...parsed };
}

export function getPullRequestDependencyGroupName(pr: AzdoPrExtractedWithProperties): string | null {
  const multiEcosystemGroupName = pr.properties?.find(
    (property) => property.name === PR_PROPERTY_DEPENDABOT_MULTI_ECOSYSTEM_GROUP_NAME,
  )?.value;
  if (multiEcosystemGroupName) return multiEcosystemGroupName;

  const value = pr.properties?.find((property) => property.name === PR_PROPERTY_DEPENDABOT_DEPENDENCIES)?.value;
  if (!value) return null;

  try {
    const parsed = DependabotPersistedPrSchema.parse(JSON.parse(value));
    return 'dependency-group-name' in parsed ? (parsed['dependency-group-name'] ?? null) : null;
  } catch {
    return null;
  }
}

function getPullRequestPackageManagers(pr: AzdoPrExtractedWithProperties): DependabotPackageManager[] {
  const packageManagersValue = pr.properties?.find(
    (property) => property.name === PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS,
  )?.value;
  if (packageManagersValue) {
    try {
      return DependabotPackageManagerSchema.array().parse(JSON.parse(packageManagersValue));
    } catch {
      return [];
    }
  }

  // TODO: Remove fallback to Dependabot.PackageManager after July 23, 2026.
  // Prefer Dependabot.PackageManagers for all reads once old PR metadata has aged out.
  const packageManagerValue = pr.properties?.find(
    (property) => property.name === PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  )?.value;
  if (!packageManagerValue) return [];

  const parsed = DependabotPackageManagerSchema.safeParse(packageManagerValue);
  return parsed.success ? [parsed.data] : [];
}

function filterPullRequestsByPackageManager(
  pr: AzdoPrExtractedWithProperties,
  packageManager: DependabotPackageManager,
) {
  return getPullRequestPackageManagers(pr).includes(packageManager);
}

export function parsePullRequestProperties(
  pullRequests: AzdoPrExtractedWithProperties[],
  packageManager: DependabotPackageManager,
): (DependabotExistingPr | DependabotExistingGroupPr)[] {
  return pullRequests.filter((pr) => filterPullRequestsByPackageManager(pr, packageManager)).map(parsePullRequestProps);
}

export function getPullRequestForDependencyNames(
  existingPullRequests: AzdoPrExtractedWithProperties[],
  packageManager: DependabotPackageManager,
  dependencyNames: string[],
  dependencyGroupName?: string | null,
): AzdoPrExtractedWithProperties | undefined {
  return existingPullRequests
    .filter((pr) => filterPullRequestsByPackageManager(pr, packageManager))
    .find((pr) => {
      const parsedPr = parsePullRequestProps(pr);
      const prGroupName = 'dependency-group-name' in parsedPr ? parsedPr['dependency-group-name'] : null;

      // For grouped PRs: match by group name (dependencies can vary)
      if (dependencyGroupName) {
        return prGroupName === dependencyGroupName;
      }

      // For non-grouped PRs: match by exact dependency names
      return !prGroupName && areEqual(getDependencyNames(parsedPr), dependencyNames);
    });
}

export function getPullRequestChangedFiles(data: DependabotCreatePullRequest | DependabotUpdatePullRequest) {
  return data['updated-dependency-files']
    .filter((file) => file.type === 'file')
    .map((file) => {
      let changeType: AzdoVersionControlChangeType = 'none';
      if (file.deleted === true || file.operation === 'delete') {
        changeType = 'delete';
      } else if (file.operation === 'update') {
        changeType = 'edit';
      } else {
        changeType = 'add';
      }
      return {
        changeType: changeType,
        path: path.join(file.directory, file.name),
        content: file.content ?? undefined,
        encoding: file.content_encoding || 'utf-8', // default to 'utf-8' if nullish or empty string
      } satisfies AzdoFileChange;
    });
}
