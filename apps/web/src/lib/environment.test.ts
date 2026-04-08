import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment', () => {
    test('platform should return "azure_container_apps" when CONTAINER_APP_ENV_DNS_SUFFIX is set', async () => {
      process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'example.com';
      const { environment } = await import('./environment');
      expect(environment.platform).toBe('azure_container_apps');
      delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
    });

    test('platform should return "vercel" when VERCEL_BRANCH_URL is set', async () => {
      process.env.VERCEL_BRANCH_URL = 'https://vercel.com';
      const { environment } = await import('./environment');
      expect(environment.platform).toBe('vercel');
      delete process.env.VERCEL_BRANCH_URL;
    });

    test('platform should return "local" when no environment variables are set', async () => {
      const { environment } = await import('./environment');
      expect(environment.platform).toBe(undefined);
    });
  });

  describe('getSiteUrl', () => {
    test('development uses correct URL', async () => {
      // ensure no influence from Vercel build
      delete process.env.VERCEL_GIT_COMMIT_REF;
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      delete process.env.VERCEL_BRANCH_URL;

      process.env.NODE_ENV = 'development';
      expect(process.env.NODE_ENV).toBe('development');
      process.env.GITHUB_REF_NAME = 'main';
      process.env.GITHUB_SHA = 'abc123';

      const { getSiteUrl } = await import('./environment');
      process.env.PORTLESS_URL = 'https://awpmarine-web.localhost';
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe('https://awpmarine-web.localhost');
      delete process.env.PORTLESS_URL;

      process.env.PORT = '3000';
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe('http://localhost:3000');
      delete process.env.PORT;
    });

    test('main uses default value', async () => {
      // ensure no influence from Vercel build
      delete process.env.VERCEL_GIT_COMMIT_REF;
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      delete process.env.VERCEL_BRANCH_URL;

      process.env.NODE_ENV = 'production';
      process.env.GITHUB_REF_NAME = 'main';
      process.env.GITHUB_SHA = 'abc123';
      const { getSiteUrl } = await import('./environment');
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe('https://contoso.com');
    });

    test('non-main uses correct value', async () => {
      // ensure no influence from GitHub Actions
      delete process.env.GITHUB_REF_NAME;
      delete process.env.GITHUB_SHA;

      process.env.NODE_ENV = 'production';

      // works for ACA
      process.env.GITHUB_REF_NAME = 'dependabot/npm_and_yarn-360aad';
      process.env.GITHUB_SHA = 'abc123';
      process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'jollyplant-9349db20.westeurope.azurecontainerapps.io';
      process.env.CONTAINER_APP_NAME = 'awpmarine-website';
      const { getSiteUrl } = await import('./environment');
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe(
        'https://awpmarine-website.jollyplant-9349db20.westeurope.azurecontainerapps.io',
      );
      delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
      delete process.env.CONTAINER_APP_NAME;
      delete process.env.GITHUB_REF_NAME;
      delete process.env.GITHUB_SHA;

      // works for Vercel
      process.env.VERCEL_GIT_COMMIT_REF = 'dependabot/npm_and_yarn-360aad';
      process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
      process.env.VERCEL_BRANCH_URL = 'website-git-dependabot-npmandyarn-360aad-maxwell-werus-projects.vercel.app/';
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe(
        'https://website-git-dependabot-npmandyarn-360aad-maxwell-werus-projects.vercel.app/',
      );
      delete process.env.VERCEL_BRANCH_URL;

      // fallback
      expect(getSiteUrl({ defaultValue: 'https://contoso.com' })).toBe('https://contoso.com');
      delete process.env.VERCEL_GIT_COMMIT_REF;
      delete process.env.VERCEL_GIT_COMMIT_SHA;
    });
  });
});
