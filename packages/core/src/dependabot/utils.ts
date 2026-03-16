import type { SecurityVulnerability } from '../github';
import type { DependabotDependency, DependabotPersistedPr } from './job';
import type { DependabotClosePullRequest, DependabotCreatePullRequest } from './update';

export function normalizeFilePath(path: string): string {
  // Convert backslashes to forward slashes, convert './' => '/' and ensure the path starts with a forward slash if it doesn't already, this is how DevOps paths are formatted
  return path
    ?.replace(/\\/g, '/')
    ?.replace(/^\.\//, '/')
    ?.replace(/^([^/])/, '/$1');
}

export function normalizeBranchName(branch: string): string;
export function normalizeBranchName(branch?: string): string | undefined;
export function normalizeBranchName(branch?: string): string | undefined {
  // Strip the 'refs/heads/' prefix from the branch name, if present
  return branch?.replace(/^refs\/heads\//i, '');
}

export function getDependencyNames(pr: DependabotPersistedPr): string[] {
  return pr.dependencies.map((dep) => dep['dependency-name']?.toString());
}

export function areEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((name) => b.includes(name));
}

export function getPullRequestCloseReason(data: DependabotClosePullRequest): string | undefined {
  // The first dependency is the "lead" dependency in a multi-dependency update
  const leadDependencyName = data['dependency-names'][0];
  let reason: string | undefined;
  switch (data.reason) {
    case 'dependencies_changed':
      reason = `Looks like the dependencies have changed`;
      break;
    case 'dependency_group_empty':
      reason = `Looks like the dependencies in this group are now empty`;
      break;
    case 'dependency_removed':
      reason = `Looks like ${leadDependencyName} is no longer a dependency`;
      break;
    case 'up_to_date':
      reason = `Looks like ${leadDependencyName} is up-to-date now`;
      break;
    case 'update_no_longer_possible':
      reason = `Looks like ${leadDependencyName} can no longer be updated`;
      break;
  }
  if (reason && reason.length > 0) {
    reason += ', so this is no longer needed.';
  }
  return reason;
}

export function getPersistedPr(data: DependabotCreatePullRequest): DependabotPersistedPr {
  return {
    'dependency-group-name': data['dependency-group']?.name || null,
    dependencies: data.dependencies.map((dep) => ({
      'dependency-name': dep.name,
      'dependency-version': dep.version,
      directory: dep.directory,
    })),
  };
}

export function getPullRequestDescription({
  packageManager,
  body,
  dependencies,
  maxDescriptionLength,
  securityVulnerabilities,
  includeCveInformation = false,
}: {
  packageManager: string;
  body: string | null | undefined;
  dependencies: DependabotDependency[];
  maxDescriptionLength?: number;
  securityVulnerabilities?: SecurityVulnerability[];
  includeCveInformation?: boolean;
}): string {
  let header = '';
  const footer = '';

  // Fix up GitHub mentions encoding issues by removing instances of the zero-width space '\u200B' as it does not render correctly in Azure DevOps.
  // https://github.com/dependabot/dependabot-core/issues/9572
  // https://github.com/dependabot/dependabot-core/blob/313fcff149b3126cb78b38d15f018907d729f8cc/common/lib/dependabot/pull_request_creator/message_builder/link_and_mention_sanitizer.rb#L245-L252
  const description = (body || '').replace(new RegExp(decodeURIComponent('%EF%BF%BD%EF%BF%BD%EF%BF%BD'), 'g'), '');

  if (includeCveInformation) {
    /* The securityVulnerabilities list contains all CVE's that were found in the run. We only want to mention those related to this PR's package. */
    let cvesForPackage: SecurityVulnerability[] = [];
    if (securityVulnerabilities) {
      cvesForPackage = securityVulnerabilities.filter((sv) => dependencies.some((d) => d.name === sv.package.name));
    }

    // If security vulnerabilities are available, add CVE information to the header
    if (cvesForPackage.length > 0) {
      header += `## CVE information \n\n`;
      header += `${cvesForPackage
        .map((cve) => {
          return securityVulnerabilitiesToMarkdown(cve);
        })
        .join('')}\n\n`;
    } else {
      // header+= `## No security vulnerabilities found \n\n`;
    }
  }

  // If there is exactly one dependency, add a compatibility score badge to the description header.
  // Compatibility scores are intended for single dependency security updates, not group updates.
  // https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores
  if (dependencies.length === 1) {
    const compatibilityScoreBadges = dependencies.map((dep) => {
      return `![Dependabot compatibility score](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=${dep.name}&package-manager=${packageManager}&previous-version=${dep['previous-version']}&new-version=${dep.version})`;
    });
    header += `${compatibilityScoreBadges.join(' ')}\n\n`;
  }

  // Build the full pull request description.
  // The header/footer must not be truncated.
  // If the description is too long and a max length is provided, we truncate the body.
  if (maxDescriptionLength) {
    const maxDescriptionLengthAfterHeaderAndFooter = maxDescriptionLength - header.length - footer.length;
    return `${header}${description.substring(0, maxDescriptionLengthAfterHeaderAndFooter)}${footer}`;
  }
  return `${header}${description}${footer}`;
}

export function securityVulnerabilitiesToMarkdown(cve: SecurityVulnerability): string {
  if (cve.advisory.identifiers.length === 0) {
    return '';
  }
  // Display package name and version.
  const ret =
    `- ${cve.package.name} ${cve.package.version ?? ''}\n` +
    // Display CVE identifiers, severity, and a link to more info if available.
    `   - ` +
    cve.advisory.identifiers
      .sort((a, b) => a.type.localeCompare(b.type))
      .map((id) => {
        return `${id.value} (${id.type})`;
      })
      .join(', ') +
    (cve.advisory.severity ? ` [${cve.advisory.severity}]` : '') +
    ': ' +
    (cve.advisory.permalink ? ` [More info](${cve.advisory.permalink})` : '') +
    '\n';

  return ret;
}

/**
 * Determines if a new pull request should supersede an existing pull request.
 *
 * Follows GitHub Dependabot's superseding logic:
 * - **Grouped PRs**: Supersede if same group name AND any dependency version changed
 * - **Single dependency PRs**: Supersede if updating the exact same dependency with a different version
 * - **Different scopes**: PRs with different dependency sets don't supersede each other
 *
 * A new PR supersedes an old PR when:
 * 1. Both are for the same group (same `dependency-group-name`), OR
 *    Both update the exact same set of dependencies (same dependency names)
 * 2. AND at least one dependency has a different version
 *
 * This prevents incorrect superseding when PRs update overlapping but different dependency sets.
 *
 * @param oldPr - The existing pull request's dependency data
 * @param newPr - The new pull request's dependency data
 * @returns `true` if the new PR should supersede the old PR, `false` otherwise
 *
 * @example
 * ```ts
 * // Single dependency - same dependency, different version: SUPERSEDE
 * const oldPr = {
 *   'dependency-group-name': null,
 *   dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.20' }]
 * };
 * const newPr = {
 *   'dependency-group-name': null,
 *   dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }]
 * };
 * shouldSupersede(oldPr, newPr); // returns true
 * ```
 *
 * @example
 * ```ts
 * // Different dependency sets - overlap but different scope: DON'T SUPERSEDE
 * const oldPr = {
 *   'dependency-group-name': null,
 *   dependencies: [
 *     { 'dependency-name': 'lodash', 'dependency-version': '4.17.20' },
 *     { 'dependency-name': 'express', 'dependency-version': '4.18.0' }
 *   ]
 * };
 * const newPr = {
 *   'dependency-group-name': null,
 *   dependencies: [
 *     { 'dependency-name': 'lodash', 'dependency-version': '4.17.21' },
 *     { 'dependency-name': 'react', 'dependency-version': '18.0.0' }
 *   ]
 * };
 * shouldSupersede(oldPr, newPr); // returns false - different dependency sets
 * ```
 *
 * @example
 * ```ts
 * // Same group - version changed: SUPERSEDE
 * const oldPr = {
 *   'dependency-group-name': 'production',
 *   dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.20' }]
 * };
 * const newPr = {
 *   'dependency-group-name': 'production',
 *   dependencies: [{ 'dependency-name': 'lodash', 'dependency-version': '4.17.21' }]
 * };
 * shouldSupersede(oldPr, newPr); // returns true - same group, version changed
 * ```
 */
export function shouldSupersede(oldPr: DependabotPersistedPr, newPr: DependabotPersistedPr): boolean {
  // Both PRs mut have the same dependency group name (including both being null/undefined)
  const oldGroupName = oldPr['dependency-group-name'];
  const newGroupName = newPr['dependency-group-name'];
  if ((oldGroupName || undefined) !== (newGroupName || undefined)) {
    return false;
  }

  const oldDeps = getDependencyNames(oldPr);
  const newDeps = getDependencyNames(newPr);

  // Non-grouped PRs must have the same dependency names
  if (!oldGroupName && !areEqual(oldDeps, newDeps)) {
    return false;
  }

  // They're in the same scope - check if any dependency version changed
  const overlappingDeps = oldDeps.filter((dep) => newDeps.includes(dep));
  for (const dep of overlappingDeps) {
    const oldDep = oldPr.dependencies.find((d) => d['dependency-name'] === dep);
    const newDep = newPr.dependencies.find((d) => d['dependency-name'] === dep);
    if (oldDep?.['dependency-version'] !== newDep?.['dependency-version']) {
      return true;
    }
  }

  // Same scope but all versions are identical - this is just a rebase
  return false;
}
