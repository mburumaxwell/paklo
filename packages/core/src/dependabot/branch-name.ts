import * as crypto from 'node:crypto';

import type { DependabotPackageEcosystem } from './config';
import type { DependabotExistingPrDependency } from './job';
import { isDependencyRemoved } from './utils';

function getDependencyDigest(dependencies: DependabotExistingPrDependency[]): string {
  return crypto
    .createHash('md5')
    .update(
      dependencies
        .map((d) => `${d['dependency-name']}-${isDependencyRemoved(d) ? 'removed' : (d['dependency-version'] ?? '')}`)
        .join(','),
    )
    .digest('hex')
    .substring(0, 10);
}

export function getBranchNameForUpdate({
  packageEcosystem,
  targetBranchName,
  directory,
  directories,
  changedFiles,
  dependencyGroupName,
  dependencies,
  separator = '/',
}: {
  packageEcosystem: DependabotPackageEcosystem;
  targetBranchName?: string;
  directory?: string;
  directories?: string[];
  changedFiles?: { path: string }[];
  dependencyGroupName?: string | null;
  dependencies: DependabotExistingPrDependency[];
  separator?: string;
}): string {
  // Based on dependabot-core implementation:
  // https://github.com/dependabot/dependabot-core/blob/main/common/lib/dependabot/pull_request_creator/branch_namer/solo_strategy.rb
  // https://github.com/dependabot/dependabot-core/blob/main/common/lib/dependabot/pull_request_creator/branch_namer/dependency_group_strategy.rb
  //
  // For grouped updates across multiple directories we intentionally omit the directory segment.
  // Those PRs span multiple manifests, so deriving the branch name from the first changed file
  // would make the branch unstable and arbitrarily tied to one directory.
  const resolvedDirectory =
    directory ||
    (dependencyGroupName && directories && directories.length > 1
      ? undefined
      : directories?.find((dir) => changedFiles?.[0]?.path?.startsWith(dir)));

  let branchName: string;
  const branchNameMightBeTooLong = dependencyGroupName || dependencies.length > 1;
  if (branchNameMightBeTooLong) {
    // Group/multi dependency update
    // e.g. dependabot/nuget/main/microsoft-3b49c54d9e
    branchName = `${dependencyGroupName || 'multi'}-${getDependencyDigest(dependencies)}`;
  } else {
    // Single dependency update
    // e.g. dependabot/nuget/main/Microsoft.Extensions.Logging-1.0.0
    const dependencyNames = dependencies
      .map((d) => d['dependency-name'])
      .join('-and-')
      .replace(/[:[]]/g, '-') // Replace `:` and `[]` with `-`
      .replace(/@/g, ''); // Remove `@`
    const versionSuffix = isDependencyRemoved(dependencies[0]) ? 'removed' : dependencies[0]?.['dependency-version'];
    branchName = `${dependencyNames}-${versionSuffix}`;
  }

  return sanitizeRef(
    [
      'dependabot',
      packageEcosystem,
      targetBranchName,
      // normalize directory to remove leading/trailing slashes and replace remaining ones with the separator
      resolvedDirectory
        ? resolvedDirectory
            .split('/')
            .filter((part) => part.length > 0)
            .join(separator)
        : undefined,
      branchName,
    ],
    separator,
  );
}

export function getBranchNameForMultiEcosystemGroup({
  groupname,
  dependencies,
  separator = '-',
}: {
  groupname: string;
  dependencies: DependabotExistingPrDependency[];
  separator?: string;
}): string {
  return sanitizeRef(['dependabot', `${groupname}-${getDependencyDigest(dependencies)}`], separator);
}

export function sanitizeRef(refParts: (string | undefined)[], separator: string): string {
  // Based on dependabot-core implementation:
  // https://github.com/dependabot/dependabot-core/blob/fc31ae64f492dc977cfe6773ab13fb6373aabec4/common/lib/dependabot/pull_request_creator/branch_namer/base.rb#L99

  // This isn't a complete implementation of git's ref validation, but it
  // covers most cases that crop up. Its list of allowed characters is a
  // bit stricter than git's, but that's for cosmetic reasons.
  return (
    refParts
      // Join the parts with the separator, ignore empty parts
      .filter((p) => p && p.trim().length > 0)
      .join(separator)
      // Remove forbidden characters (those not already replaced elsewhere)
      .replace(/[^A-Za-z0-9/\-_.(){}]/g, '')
      // Slashes can't be followed by periods
      .replace(/\/\./g, '/dot-')
      // Squeeze out consecutive periods and slashes
      .replace(/\.+/g, '.')
      .replace(/\/+/g, '/')
      // Trailing periods are forbidden
      .replace(/\.$/, '')
  );
}
