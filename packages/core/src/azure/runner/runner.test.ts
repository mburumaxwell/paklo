/* oxlint-disable typescript/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractRepositoryUrl } from '@/azure';
import {
  type AzdoPrExtractedWithProperties,
  AzureDevOpsClientWrapper,
  PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
  PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME,
} from '@/azure/client';
import { DEFAULT_EXPERIMENTS, type DependabotConfig, type DependabotUpdate } from '@/dependabot';
import { GitHubSecurityAdvisoryClient } from '@/github';
import type { SecretMasker } from '@/runner/api-client';
import { runJob } from '@/runner/run';

import { AzureLocalJobsRunner, type AzureLocalJobsRunnerOptions } from './runner';

vi.mock('@/github', () => ({
  GitHubSecurityAdvisoryClient: vi.fn(),
  filterVulnerabilities: vi.fn((vulns) => vulns || []),
  getGhsaPackageEcosystemFromDependabotPackageManager: vi.fn(() => 'npm'),
}));
vi.mock('@/azure/client', async () => {
  const actual = await vi.importActual('@/azure/client');
  return {
    ...actual,
    AzureDevOpsClientWrapper: vi.fn(),
  };
});
vi.mock('@/runner/run', async () => {
  const actual = await vi.importActual('@/runner/run');
  return {
    ...actual,
    runJob: vi.fn(),
  };
});

// Helper function to create a partial jobs runner that allows testing private methods
class TestableAzureLocalJobsRunner extends AzureLocalJobsRunner {
  public async testAbandonPullRequestsWhereSourceRefIsDeleted(
    existingBranchNames?: string[],
    existingPullRequests?: AzdoPrExtractedWithProperties[],
  ): Promise<void> {
    return (this as any).abandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);
  }

  public async testPerformUpdates(
    server: any,
    updates: DependabotUpdate[],
    command: any,
    existingPullRequests: AzdoPrExtractedWithProperties[],
    dependabotApiUrl: string,
    dependabotApiDockerUrl?: string,
  ): Promise<any> {
    return (this as any).performUpdates(
      server,
      updates,
      command,
      existingPullRequests,
      dependabotApiUrl,
      dependabotApiDockerUrl,
    );
  }
}

describe('AzureLocalJobsRunner', () => {
  let jobsRunner: TestableAzureLocalJobsRunner;
  let options: AzureLocalJobsRunnerOptions;
  let existingBranchNames: string[];
  let existingPullRequests: AzdoPrExtractedWithProperties[];
  let mockAuthorClient: AzureDevOpsClientWrapper;
  let mockServer: {
    add: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    requests: ReturnType<typeof vi.fn>;
    allAffectedPrs: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    existingBranchNames = [];
    existingPullRequests = [
      {
        pullRequestId: 1,
        properties: [
          {
            name: PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME,
            value: 'dependabot/nuget/dependency1-1.0.0',
          },
        ],
      },
    ];

    options = {
      url: extractRepositoryUrl({
        organizationUrl: 'https://dev.azure.com/test-org/',
        project: 'test-project',
        repository: 'test-repo',
      }),
      port: 3000,
      gitToken: 'fake-git-token',
      autoApprove: false,
      setAutoComplete: false,
      autoCompleteIgnoreConfigIds: [],
      author: { name: 'dependabot', email: 'dependabot@test.com' },
      dryRun: false,
      debug: false,
      secretMasker: vi.fn() as SecretMasker,
      config: {
        updates: [
          {
            'package-ecosystem': 'npm',
            'directory': '/',
            'open-pull-requests-limit': 5,
          } as DependabotUpdate,
        ],
        registries: {},
      } as DependabotConfig,
      command: 'update',
      experiments: DEFAULT_EXPERIMENTS,
    };

    // Mock AzureDevOpsClientWrapper
    mockAuthorClient = {
      getBranchNames: vi.fn().mockResolvedValue(existingBranchNames),
      getActivePullRequestProperties: vi.fn().mockResolvedValue(existingPullRequests),
      getUserId: vi.fn().mockResolvedValue('user-123'),
      abandonPullRequest: vi.fn().mockResolvedValue(true),
    } as unknown as AzureDevOpsClientWrapper;

    vi.mocked(AzureDevOpsClientWrapper).mockImplementation(function MockAzureDevOpsClientWrapper() {
      return mockAuthorClient as AzureDevOpsClientWrapper;
    } as any);

    // Minimal server shape required by performUpdates tests
    mockServer = {
      add: vi.fn(),
      clear: vi.fn(),
      requests: vi.fn().mockReturnValue([]),
      allAffectedPrs: vi.fn().mockReturnValue([]),
    };

    jobsRunner = new TestableAzureLocalJobsRunner(options);
  });

  describe('abandonPullRequestsWhereSourceRefIsDeleted', () => {
    it('should abandon pull requests where the source branch has been deleted', async () => {
      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).toHaveBeenCalledWith({
        project: 'test-project',
        pullRequestId: 1,
        repository: 'test-repo',
        comment:
          'It might be a good idea to add an ' +
          '[`ignore` condition](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#ignore--) ' +
          'with the desired `update-types` to your config file.',
      });
    });

    it('should not abandon pull requests when `dryRun` is true', async () => {
      options.dryRun = true;
      jobsRunner = new TestableAzureLocalJobsRunner(options);

      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should not abandon pull requests where the source branch still exists', async () => {
      existingBranchNames = ['dependabot/nuget/dependency1-1.0.0'];

      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should ignore "refs/heads/" prefix when comparing branch names', async () => {
      existingBranchNames = ['dependabot/nuget/dependency1-1.0.0'];
      existingPullRequests = [
        {
          pullRequestId: 1,
          properties: [
            {
              name: PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME,
              value: 'refs/heads/dependabot/nuget/dependency1-1.0.0',
            },
          ],
        },
      ];

      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should not abandon any pull requests if existingBranchNames is undefined', async () => {
      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(undefined, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should not abandon any pull requests if existingPullRequests is undefined', async () => {
      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, undefined);

      expect(mockAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should remove the pull request from the existing pull requests list after abandoning it', async () => {
      const pullRequestToBeAbandoned = existingPullRequests[0];
      const initialLength = existingPullRequests.length;

      await jobsRunner.testAbandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      expect(mockAuthorClient.abandonPullRequest).toHaveBeenCalled();
      expect(existingPullRequests.length).toBe(initialLength - 1);
      expect(existingPullRequests).not.toContain(pullRequestToBeAbandoned);
    });
  });

  describe('performUpdates', () => {
    beforeEach(() => {
      vi.mocked(runJob).mockResolvedValue({ success: true, message: 'Job completed successfully' });
    });

    it('should perform "update all" job successfully', async () => {
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      expect(runJob).toHaveBeenCalled();
    });

    it('should skip "update all" job if open pull requests limit is reached', async () => {
      options.config.updates[0]!['open-pull-requests-limit'] = 1;
      const existingPRs = [
        {
          pullRequestId: 1,
          properties: [
            {
              name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
              value: 'npm_and_yarn',
            },
            {
              name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
              value: JSON.stringify({ dependencies: [{ 'dependency-name': 'dependency1' }] }),
            },
          ],
        },
      ];

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        existingPRs,
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      // Should still call runJob for existing PRs, but not for new updates
      expect(runJob).toHaveBeenCalled();
    });

    it('should perform "update security-only" job if open pull request limit is zero', async () => {
      options.config.updates[0]!['open-pull-requests-limit'] = 0;
      options.githubToken = 'fake-github-token';

      // Mock GitHubSecurityAdvisoryClient properly
      const mockGhsaClient = {
        getSecurityVulnerabilitiesAsync: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(GitHubSecurityAdvisoryClient).mockImplementation(function MockGitHubSecurityAdvisoryClient() {
        return mockGhsaClient as any;
      } as any);

      mockServer.requests = vi.fn().mockReturnValue([
        {
          type: 'update_dependency_list',
          data: {
            dependencies: [{ name: 'test-package', version: '1.0.0' }],
          },
        },
      ]);

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toEqual([]);
      expect(runJob).toHaveBeenCalledTimes(1); // Only the dependencies list job
    });

    it('should perform "update pull request" job successfully if there are existing pull requests', async () => {
      options.config.updates[0]!['open-pull-requests-limit'] = 1;
      const existingPRs = [
        {
          pullRequestId: 1,
          properties: [
            {
              name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
              value: 'npm_and_yarn',
            },
            {
              name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
              value: JSON.stringify({ dependencies: [{ 'dependency-name': 'dependency1' }] }),
            },
          ],
        },
      ];

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        existingPRs,
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      expect(runJob).toHaveBeenCalled();
    });

    it('should return success when all updates are successful', async () => {
      vi.mocked(runJob).mockResolvedValue({ success: true, message: 'Job completed successfully' });

      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
    });

    it('should return failure when updates fail', async () => {
      vi.mocked(runJob).mockResolvedValue({ success: false, message: 'Job failed' });

      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: false,
        message: 'Job failed',
        affectedPrs: [],
      });
    });

    it('should handle security advisories file', async () => {
      options.config.updates[0]!['open-pull-requests-limit'] = 0;
      options.securityAdvisoriesFile = '/path/to/advisories.json';

      // Mock GitHubSecurityAdvisoryClient
      const mockGhsaClient = {
        getSecurityVulnerabilitiesAsync: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(GitHubSecurityAdvisoryClient).mockImplementation(function MockGitHubSecurityAdvisoryClient() {
        return mockGhsaClient as any;
      } as any);

      mockServer.requests = vi.fn().mockReturnValue([
        {
          type: 'update_dependency_list',
          data: {
            dependencies: [{ name: 'test-package', version: '1.0.0' }],
          },
        },
      ]);

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toEqual([]);
    });

    it('should skip existing PR updates when dryRun is true', async () => {
      options.dryRun = true;
      const existingPRs = [
        {
          pullRequestId: 1,
          properties: [
            {
              name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
              value: 'npm_and_yarn',
            },
            {
              name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
              value: JSON.stringify({ dependencies: [{ 'dependency-name': 'dependency1' }] }),
            },
          ],
        },
      ];

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        existingPRs,
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      // Should call runJob for the main update, but not for existing PRs
      expect(runJob).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple updates sequentially', async () => {
      // Mock successful job runs for multiple package ecosystems
      vi.mocked(runJob).mockResolvedValue({ success: true, message: 'Job completed successfully' });

      // Create a config with multiple updates to test sequential processing
      options.config.updates = [
        {
          'package-ecosystem': 'npm',
          'directory': '/',
          'open-pull-requests-limit': 5,
        } as DependabotUpdate,
        {
          'package-ecosystem': 'nuget',
          'directory': '/src',
          'open-pull-requests-limit': 5,
        } as DependabotUpdate,
      ];

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      expect(result[1]).toMatchObject({
        success: true,
        message: 'Job completed successfully',
        affectedPrs: [],
      });
      expect(runJob).toHaveBeenCalledTimes(2);
    });

    it('should return failure when no dependencies found for security updates', async () => {
      options.config.updates[0]!['open-pull-requests-limit'] = 0;
      options.githubToken = 'fake-github-token';

      // Mock server to return no dependencies
      mockServer.requests = vi.fn().mockReturnValue([
        {
          type: 'update_dependency_list',
          data: {
            dependencies: [],
          },
        },
      ]);

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toEqual([]);
      // Should only call runJob once for dependency list, not for actual updates
      expect(runJob).toHaveBeenCalledTimes(1);
    });

    it('should continue processing all updates even when some fail', async () => {
      // Mock a failing job run
      vi.mocked(runJob).mockResolvedValue({ success: false, message: 'Job failed' });

      // Create a config with multiple updates - should process all even if some fail
      options.config.updates = [
        {
          'package-ecosystem': 'npm',
          'directory': '/',
          'open-pull-requests-limit': 5,
        } as DependabotUpdate,
        {
          'package-ecosystem': 'nuget',
          'directory': '/src',
          'open-pull-requests-limit': 5,
        } as DependabotUpdate,
      ];

      jobsRunner = new TestableAzureLocalJobsRunner(options);
      const result = await jobsRunner.testPerformUpdates(
        mockServer,
        options.config.updates,
        'update',
        [],
        'http://localhost:3000/api',
        'http://localhost:3000/api',
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        success: false,
        message: 'Job failed',
        affectedPrs: [],
      });
      expect(result[1]).toMatchObject({
        success: false,
        message: 'Job failed',
        affectedPrs: [],
      });
      // Should call runJob for both updates since there's no short-circuiting
      expect(runJob).toHaveBeenCalledTimes(2);
    });
  });
});
