import * as semver from 'semver';

import type { DependabotPackageEcosystem, DependabotUpdateType } from './config';
import type { DependabotExistingGroupPr, DependabotExistingPr, DependabotPackageManager } from './job';
import { mapPackageManagerToPackageEcosystem } from './job-builder';

export type DependabotPullRequestUpdatedDependency = {
  'dependency-name': string;
  'dependency-type': string;
  'update-type': DependabotUpdateType | null;
  'directory': string;
  'package-ecosystem': DependabotPackageEcosystem;
  'target-branch': string;
  'previous-version': string;
  'new-version': string;
  'compatibility-score': number;
  'maintainer-changes': boolean;
  'dependency-group': string;
  'alert-state': string;
  'ghsa-id': string;
  'cvss': number;
};

export type DependabotPullRequestMetadata = {
  'dependency-names': string;
  'dependency-type': string;
  'update-type': DependabotUpdateType | null;
  'updated-dependencies-json': DependabotPullRequestUpdatedDependency[];
  'directory': string;
  'package-ecosystem': DependabotPackageEcosystem;
  'target-branch': string;
  'previous-version': string;
  'new-version': string;
  'compatibility-score': number;
  'maintainer-changes': boolean;
  'dependency-group': string;
  'alert-state': string;
  'ghsa-id': string;
  'cvss': number;
};

export function extractPullRequestMetadata(
  description: string | null | undefined,
  parsed: DependabotExistingPr | DependabotExistingGroupPr,
  packageManagers: DependabotPackageManager[],
  targetBranch: string,
): DependabotPullRequestMetadata {
  const packageEcosystem = mapPackageManagerToPackageEcosystem(packageManagers[0]!);
  const dependencyGroup = 'dependency-group-name' in parsed ? (parsed['dependency-group-name'] ?? '') : '';
  const maintainerChanges = /Maintainer changes/m.test(description ?? '');

  const updatedDependencies = parsed.dependencies.map((dependency): DependabotPullRequestUpdatedDependency => {
    const previousVersion = dependency['previous-version'] ?? '';
    const newVersion = dependency['dependency-version'] ?? '';
    return {
      'dependency-name': dependency['dependency-name'],
      'dependency-type': '',
      'update-type': getUpdateType(previousVersion, newVersion),
      'directory': dependency.directory ?? '',
      'package-ecosystem': packageEcosystem,
      'target-branch': targetBranch,
      'previous-version': previousVersion,
      'new-version': newVersion,
      'compatibility-score': 0,
      'maintainer-changes': maintainerChanges,
      'dependency-group': dependencyGroup,
      'alert-state': '',
      'ghsa-id': '',
      'cvss': 0,
    };
  });
  const firstDependency = updatedDependencies[0];

  return {
    'dependency-names': updatedDependencies.map((dependency) => dependency['dependency-name']).join(', '),
    'dependency-type': '',
    'update-type': getHighestUpdateType(updatedDependencies),
    'updated-dependencies-json': updatedDependencies,
    'directory': firstDependency?.['directory'] ?? '',
    'package-ecosystem': packageEcosystem,
    'target-branch': targetBranch,
    'previous-version': firstDependency?.['previous-version'] ?? '',
    'new-version': firstDependency?.['new-version'] ?? '',
    'compatibility-score': 0,
    'maintainer-changes': maintainerChanges,
    'dependency-group': dependencyGroup,
    'alert-state': '',
    'ghsa-id': '',
    'cvss': 0,
  };
}

function getUpdateType(
  previousVersion: string | null | undefined,
  newVersion: string | null | undefined,
): DependabotUpdateType | null {
  const previous = semver.coerce(previousVersion ?? '');
  const next = semver.coerce(newVersion ?? '');
  if (!previous || !next || semver.eq(previous, next)) return null;
  if (previous.major !== next.major) return 'version-update:semver-major';
  if (previous.minor !== next.minor) return 'version-update:semver-minor';
  if (previous.patch !== next.patch) return 'version-update:semver-patch';
  return null;
}

function getHighestUpdateType(deps: DependabotPullRequestUpdatedDependency[]): DependabotUpdateType | null {
  return (
    deps.find((dep) => dep['update-type'] === 'version-update:semver-major')?.['update-type'] ??
    deps.find((dep) => dep['update-type'] === 'version-update:semver-minor')?.['update-type'] ??
    deps.find((dep) => dep['update-type'] === 'version-update:semver-patch')?.['update-type'] ??
    null
  );
}
