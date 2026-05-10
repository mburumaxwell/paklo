import * as yaml from 'js-yaml';
import ky from 'ky';
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

export type CompatibilityScoreLookup = (
  dependencyName: string,
  packageEcosystem: DependabotPackageEcosystem,
  previousVersion: string,
  newVersion: string,
) => Promise<number>;

export async function extractPullRequestMetadata(
  description: string | null | undefined,
  parsed: DependabotExistingPr | DependabotExistingGroupPr,
  packageManagers: DependabotPackageManager[],
  targetBranch: string,
  scoreLookup: CompatibilityScoreLookup = getCompatibilityScore,
  commitMessage?: string | null,
): Promise<DependabotPullRequestMetadata> {
  const packageEcosystem = mapPackageManagerToPackageEcosystem(packageManagers[0]!);
  const dependencyGroup = 'dependency-group-name' in parsed ? (parsed['dependency-group-name'] ?? '') : '';
  const maintainerChanges = /Maintainer changes/m.test(description ?? '');
  const dependencyTypesByName = getDependencyTypesByName(commitMessage);

  const updatedDependencies = await Promise.all(
    parsed.dependencies.map(async (dependency): Promise<DependabotPullRequestUpdatedDependency> => {
      const dependencyType = dependencyTypesByName.get(dependency['dependency-name'])?.shift() ?? 'unknown';
      const previousVersion = dependency['previous-version'] ?? '';
      const newVersion = dependency['dependency-version'] ?? '';
      return {
        'dependency-name': dependency['dependency-name'],
        'dependency-type': dependencyType,
        'update-type': getUpdateType(previousVersion, newVersion),
        'directory': dependency.directory ?? '',
        'package-ecosystem': packageEcosystem,
        'target-branch': targetBranch,
        'previous-version': previousVersion,
        'new-version': newVersion,
        'compatibility-score': await scoreLookup(
          dependency['dependency-name'],
          packageEcosystem,
          previousVersion,
          newVersion,
        ),
        'maintainer-changes': maintainerChanges,
        'dependency-group': dependencyGroup,
        'alert-state': '',
        'ghsa-id': '',
        'cvss': 0,
      };
    }),
  );
  const firstDependency = updatedDependencies[0];
  if (!firstDependency) {
    throw new Error('No dependencies were found in the pull request metadata.');
  }

  return {
    'dependency-names': updatedDependencies.map((dependency) => dependency['dependency-name']).join(', '),
    'dependency-type': getHighestDependencyType(updatedDependencies),
    'update-type': getHighestUpdateType(updatedDependencies),
    'updated-dependencies-json': updatedDependencies,
    'directory': firstDependency['directory'] ?? '',
    'package-ecosystem': packageEcosystem,
    'target-branch': targetBranch,
    'previous-version': firstDependency['previous-version'] ?? '',
    'new-version': firstDependency['new-version'] ?? '',
    'compatibility-score': firstDependency['compatibility-score'],
    'maintainer-changes': maintainerChanges,
    'dependency-group': dependencyGroup,
    'alert-state': '', // TODO: populate
    'ghsa-id': '', // TODO: populate
    'cvss': 0, // TODO: populate
  };
}

function getDependencyTypesByName(commitMessage: string | null | undefined): Map<string, string[]> {
  const fragment = commitMessage?.match(/^---\r?\n(?<metadata>[\s\S]*?)\r?\n^\.\.\.\s*(?:\r?\n|$)/m)?.groups?.metadata;
  if (!fragment) return new Map();

  let metadata: unknown;
  try {
    metadata = yaml.load(fragment);
  } catch {
    return new Map();
  }
  if (!isRecord(metadata) || !Array.isArray(metadata['updated-dependencies'])) return new Map();

  const dependencyTypes = new Map<string, string[]>();
  for (const dependency of metadata['updated-dependencies']) {
    if (!isRecord(dependency)) continue;

    const name = dependency['dependency-name'];
    const type = dependency['dependency-type'];
    if (typeof name !== 'string' || typeof type !== 'string' || !type) continue;

    const types = dependencyTypes.get(name) ?? [];
    types.push(type);
    dependencyTypes.set(name, types);
  }

  return dependencyTypes;
}

function getHighestDependencyType(deps: DependabotPullRequestUpdatedDependency[]): string {
  return (
    deps.find((dep) => dep['dependency-type'] === 'direct:production')?.['dependency-type'] ??
    deps.find((dep) => dep['dependency-type'] === 'direct:development')?.['dependency-type'] ??
    deps.find((dep) => dep['dependency-type'] === 'indirect')?.['dependency-type'] ??
    'unknown'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export async function getCompatibilityScore(
  dependencyName: string,
  packageEcosystem: DependabotPackageEcosystem,
  previousVersion: string,
  newVersion: string,
): Promise<number> {
  if (!previousVersion || !newVersion) return 0;

  const url = new URL('https://dependabot-badges.githubapp.com/badges/compatibility_score');
  url.searchParams.set('dependency-name', dependencyName);
  url.searchParams.set('package-manager', packageEcosystem);
  url.searchParams.set('previous-version', previousVersion);
  url.searchParams.set('new-version', newVersion);

  const svg = await ky(url, { retry: 0 })
    .text()
    .catch(() => '');
  const score = svg.match(/<title>compatibility: (?<score>\d+)%<\/title>/m)?.groups?.score;
  return score ? Number.parseInt(score, 10) : 0;
}
