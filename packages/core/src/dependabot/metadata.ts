import * as yaml from 'js-yaml';
import ky from 'ky';
import * as semver from 'semver';
import { z } from 'zod';

import { type DependabotPackageEcosystem, type DependabotUpdateType, DependabotUpdateTypeSchema } from './config';
import type {
  DependabotDependency,
  DependabotExistingGroupPr,
  DependabotExistingPr,
  DependabotPackageManager,
} from './job';
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
  'ghsa-id': string;
  'cvss': number;
};

export type DependabotPullRequestSecurityVulnerability = {
  package: { name: string; version?: string | null };
  vulnerableVersionRange: string;
  advisory: {
    identifiers: { type: string; value: string }[];
    cvss?: { score: number } | null;
  };
};

export type CompatibilityScoreLookup = (
  dependencyName: string,
  packageEcosystem: DependabotPackageEcosystem,
  previousVersion: string,
  newVersion: string,
) => Promise<number>;

const PULL_REQUEST_COMMIT_METADATA_PATTERN = /^---\r?\n(?<metadata>[\s\S]*?)\r?\n^\.\.\.\s*(?:\r?\n|$)/m;

const PullRequestCommitMetadataSchema = z.object({
  'updated-dependencies': z.unknown().array(),
});
const CommitDependencyMetadataSchema = z.object({
  'dependency-name': z.string().min(1),
  'dependency-version': z.string().optional(),
  'dependency-type': z.string().optional(),
  'update-type': DependabotUpdateTypeSchema.optional(),
  'dependency-group': z.string().optional(),
  'ghsa-id': z.string().optional(),
  'cvss': z.coerce.number().optional(),
});

export function hasPullRequestCommitMetadata(message: string | null | undefined): boolean {
  return PULL_REQUEST_COMMIT_METADATA_PATTERN.test(message ?? '');
}

export function getPullRequestCommitMetadataFooter(
  dependencies: DependabotDependency[],
  dependencyGroupName?: string | null,
  securityVulnerabilities: DependabotPullRequestSecurityVulnerability[] = [],
): string {
  if (dependencies.length === 0) return '';

  const metadata = {
    'updated-dependencies': dependencies.map((dependency) => {
      const updateType = getUpdateType(dependency['previous-version'], dependency.version);
      const advisory = getDependencyAdvisory(dependency, securityVulnerabilities);
      return {
        'dependency-name': dependency.name,
        'dependency-version': dependency.version ?? '',
        'dependency-type': getDependencyType(dependency),
        ...(updateType ? { 'update-type': updateType } : {}),
        ...(dependencyGroupName ? { 'dependency-group': dependencyGroupName } : {}),
        ...(advisory?.ghsaId ? { 'ghsa-id': advisory.ghsaId } : {}),
        ...(advisory?.cvss ? { cvss: advisory.cvss } : {}),
      };
    }),
  };

  return `\n\n---\n${yaml.dump(metadata, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quoteStyle: 'single',
  })}...\n`;
}

export async function extractPullRequestMetadata(
  description: string | null | undefined,
  parsed: DependabotExistingPr | DependabotExistingGroupPr,
  packageManagers: DependabotPackageManager[],
  targetBranch: string,
  scoreLookup: CompatibilityScoreLookup = getCompatibilityScore,
  commitMessage?: string | null,
): Promise<DependabotPullRequestMetadata> {
  const packageEcosystem = mapPackageManagerToPackageEcosystem(packageManagers[0]!);
  const maintainerChanges = /Maintainer changes/m.test(description ?? '');
  const commitMetadata = getCommitMetadataDependencies(commitMessage);

  const updatedDependencies = await Promise.all(
    parsed.dependencies.map(async (dependency): Promise<DependabotPullRequestUpdatedDependency> => {
      const meta = commitMetadata.get(dependency['dependency-name'])?.shift();
      const previousVersion = dependency['previous-version'] ?? '';
      const newVersion = meta?.['dependency-version'] ?? dependency['dependency-version'] ?? '';
      return {
        'dependency-name': dependency['dependency-name'],
        'dependency-type': meta?.['dependency-type'] ?? 'unknown',
        'update-type': meta?.['update-type'] ?? getUpdateType(previousVersion, newVersion),
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
        'dependency-group':
          meta?.['dependency-group'] ??
          ('dependency-group-name' in parsed ? (parsed['dependency-group-name'] ?? '') : ''),
        'ghsa-id': meta?.['ghsa-id'] ?? '',
        'cvss': meta?.cvss ?? 0,
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
    'dependency-group': firstDependency['dependency-group'],
    'ghsa-id': firstDependency['ghsa-id'],
    'cvss': firstDependency['cvss'],
  };
}

type CommitDependencyMetadata = z.output<typeof CommitDependencyMetadataSchema>;

function getCommitMetadataDependencies(
  commitMessage: string | null | undefined,
): Map<string, CommitDependencyMetadata[]> {
  const fragment = commitMessage?.match(PULL_REQUEST_COMMIT_METADATA_PATTERN)?.groups?.metadata;
  if (!fragment) return new Map();

  let metadata: unknown;
  try {
    metadata = yaml.load(fragment);
  } catch {
    return new Map();
  }
  const parsed = PullRequestCommitMetadataSchema.safeParse(metadata);
  if (!parsed.success) return new Map();

  const dependencies = new Map<string, CommitDependencyMetadata[]>();
  for (const dependency of parsed.data['updated-dependencies']) {
    const entry = CommitDependencyMetadataSchema.safeParse(dependency);
    if (!entry.success) continue;

    const entries = dependencies.get(entry.data['dependency-name']) ?? [];
    entries.push(entry.data);
    dependencies.set(entry.data['dependency-name'], entries);
  }

  return dependencies;
}

function getHighestDependencyType(deps: DependabotPullRequestUpdatedDependency[]): string {
  return (
    deps.find((dep) => dep['dependency-type'] === 'direct:production')?.['dependency-type'] ??
    deps.find((dep) => dep['dependency-type'] === 'direct:development')?.['dependency-type'] ??
    deps.find((dep) => dep['dependency-type'] === 'indirect')?.['dependency-type'] ??
    'unknown'
  );
}

export function getDependencyType(
  dependency: DependabotDependency,
): 'direct:production' | 'direct:development' | 'indirect' {
  const requirements = dependency.requirements ?? dependency['previous-requirements'] ?? [];
  if (requirements.length === 0) return 'indirect';

  const groups = requirements.flatMap((requirement) => requirement.groups ?? []);
  if (groups.some(isDevelopmentRequirementGroup)) return 'direct:development';

  return 'direct:production';
}

function getDependencyAdvisory(
  dependency: DependabotDependency,
  securityVulnerabilities: DependabotPullRequestSecurityVulnerability[],
): { ghsaId: string; cvss: number } | undefined {
  const previousVersion = dependency['previous-version'];
  const matches = securityVulnerabilities
    .filter((vulnerability) => vulnerability.package.name === dependency.name)
    .filter((vulnerability) => isVersionInRange(previousVersion, vulnerability.vulnerableVersionRange));
  const highest = matches.sort((a, b) => getCvss(b) - getCvss(a))[0];
  if (!highest) return undefined;

  const ghsaId = highest.advisory.identifiers.find((identifier) => identifier.type === 'GHSA')?.value ?? '';
  return { ghsaId, cvss: getCvss(highest) };
}

function getCvss(vulnerability: DependabotPullRequestSecurityVulnerability): number {
  return vulnerability.advisory.cvss?.score ?? 0;
}

function isVersionInRange(version: string | null | undefined, range: string): boolean {
  if (!version) return true;
  try {
    return range
      .split(',')
      .map((part) => part.trim())
      .every((part) => semver.satisfies(version, part));
  } catch {
    return false;
  }
}

function isDevelopmentRequirementGroup(group: string): boolean {
  const normalized = group.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  return ['dev', 'develop', 'development', 'devdependencies', 'test', 'tests'].includes(normalized);
}

export function getUpdateType(
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
