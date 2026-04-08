export type Platform = 'azure_container_apps' | 'vercel';

export type Environment = {
  /** The current environment. */
  name?: 'development' | 'production' | 'test';

  /** Whether the current environment is development. */
  development: boolean;

  /** Whether the current environment is production. */
  production: boolean;

  /** Whether the current environment is test. */
  test: boolean;

  /** The current platform. */
  platform?: Platform;

  /** The current commit SHA. */
  sha?: string;

  /** The current branch name. */
  branch?: string;

  /** Whether the current branch is the main branch. */
  main: boolean;
};

function getEnvironment(): Environment {
  function execGitCommand(command: string): string | undefined {
    try {
      const { execSync } = require('node:child_process');
      return execSync(command).toString().trim();
    } catch {
      return undefined;
    }
  }

  const env = process.env.NODE_ENV as Environment['name'];
  const branch =
    process.env.GITHUB_REF_NAME ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    execGitCommand('git rev-parse --abbrev-ref HEAD');
  const sha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || execGitCommand('git rev-parse HEAD');
  const platform =
    (process.env.CONTAINER_APP_ENV_DNS_SUFFIX && 'azure_container_apps') ||
    (process.env.VERCEL_BRANCH_URL && 'vercel') ||
    undefined;

  return {
    name: env,
    development: env === 'development',
    production: env === 'production',
    test: env === 'test',
    platform,
    sha,
    branch,
    main: branch === 'main',
  };
}

export const environment = getEnvironment();

export interface SiteUrlOptions {
  /** The default URL to use if no other URL is found. */
  defaultValue: string;
}

export function getSiteUrl({ defaultValue }: SiteUrlOptions): string {
  const { development, main } = environment;

  // if we are in development, use portless or localhost
  if (development) return process.env.PORTLESS_URL || `http://localhost:${process.env.PORT || 3000}`;

  // if we are on the main branch, use the known URL
  if (main) return defaultValue;

  // if we are on Azure ContainerApps, use the provided URL
  let value = getSiteUrlForAca();
  if (value && value.length > 0) return value;

  // if we are on Vercel, use the provided URL
  value = process.env.VERCEL_BRANCH_URL;
  if (value && value.length > 0) return `https://${value}`;

  return defaultValue; // fallback (edge cases)
}

function getSiteUrlForAca(): string | undefined {
  /*
   * Having looked at the available ENV variables when deployed, we can form the URL from
   * combinations of the following variables:
   * CONTAINER_APP_ENV_DNS_SUFFIX (e.g. "jollyplant-9349db20.westeurope.azurecontainerapps.io")
   * CONTAINER_APP_NAME (e.g. "paklo-website")
   */

  const suffix = process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
  const name = process.env.CONTAINER_APP_NAME;
  if (!suffix || !name) return undefined;
  return `https://${name}.${suffix}`;
}
