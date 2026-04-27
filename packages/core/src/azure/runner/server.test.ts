/* oxlint-disable typescript/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type AzdoPrExtractedWithProperties,
  type AzureDevOpsClientWrapper,
  PR_DESCRIPTION_MAX_LENGTH,
  PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
  PR_PROPERTY_DEPENDABOT_MULTI_ECOSYSTEM_GROUP_NAME,
  PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS,
} from '@/azure/client';
import type { DependabotConfig, DependabotJobBuilderOutput, DependabotUpdate, ExecutionUnit } from '@/dependabot';

import { extractRepositoryUrl } from '../url-parts';
import { AzureLocalDependabotServer, type AzureLocalDependabotServerOptions } from './server';

vi.mock('./client');
vi.mock('./logger');

describe('AzureLocalDependabotServer', () => {
  let server: AzureLocalDependabotServer;
  let options: AzureLocalDependabotServerOptions;
  let authorClient: AzureDevOpsClientWrapper;
  let approverClient: AzureDevOpsClientWrapper;
  let existingBranchNames: string[];
  let existingPullRequests: AzdoPrExtractedWithProperties[];

  beforeEach(() => {
    authorClient = {
      createPullRequest: vi.fn(),
      updatePullRequest: vi.fn(),
      abandonPullRequest: vi.fn(),
      addCommentThread: vi.fn(),
      approvePullRequest: vi.fn(),
      getDefaultBranch: vi.fn(),
    } as unknown as AzureDevOpsClientWrapper;

    approverClient = {
      approvePullRequest: vi.fn(),
    } as unknown as AzureDevOpsClientWrapper;

    existingBranchNames = [];
    existingPullRequests = [];

    options = {
      url: extractRepositoryUrl({
        organizationUrl: 'http://localhost:8081/contoso/',
        project: 'testproject',
        repository: 'test-repo',
      }),
      authorClient,
      autoApprove: false,
      approverClient,
      config: {
        version: 2,
        updates: [],
      } as unknown as DependabotConfig,
      setAutoComplete: false,
      autoCompleteIgnoreConfigIds: [],
      existingBranchNames,
      existingPullRequests,
      author: { email: 'test@example.com', name: 'Test User' },
      debug: false,
      dryRun: false,
    };

    server = new AzureLocalDependabotServer(options);
  });

  describe('handle', () => {
    let jobBuilderOutput: DependabotJobBuilderOutput;
    let update: DependabotUpdate;

    function makeMultiEcosystemExecutionUnit(updates: DependabotUpdate[]): ExecutionUnit {
      return {
        kind: 'multi-ecosystem',
        groupname: 'infrastructure',
        group: options.config['multi-ecosystem-groups']!.infrastructure!,
        updates,
      };
    }

    beforeEach(() => {
      vi.clearAllMocks();
      jobBuilderOutput = {
        job: {
          'id': '1',
          'package-manager': 'npm_and_yarn',
          'source': {
            hostname: 'localhost:8081',
            provider: 'azure',
            repo: 'testproject/_git/test-repo',
          },
          'experiments': {},
          'credentials-metadata': [],
          'allowed-updates': [],
          'existing-group-pull-requests': [],
          'existing-pull-requests': [],
          'lockfile-only': false,
          'requirements-update-strategy': null,
          'update-subdependencies': false,
          'debug': false,
          'dependencies': [],
          'security-advisories': [],
          'security-updates-only': false,
          'updating-a-pull-request': false,
          'ignore-conditions': [],
          'commit-message-options': {
            'prefix': null,
            'prefix-development': null,
            'include-scope': null,
          },
          'repo-private': true,
          'vendor-dependencies': false,
        },
        credentials: [],
      };
      update = {
        'package-ecosystem': 'npm',
        'schedule': { interval: 'daily', time: '02:00', timezone: 'UTC', day: 'sunday' },
      };

      // Mock the job and update methods
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });
    });

    it('should process "update_dependency_list"', async () => {
      const result = await (server as any).handle('1', {
        type: 'update_dependency_list',
        data: {
          dependencies: [],
          dependency_files: [],
        },
      });

      expect(result).toEqual(true);
    });

    it('should process "create_dependency_submission"', async () => {
      const result = await (server as any).handle('1', {
        type: 'create_dependency_submission',
        data: {
          version: 1,
          sha: '41fa8b4fe8d90fe7db38d4b730768e7dc52bc983',
          ref: 'refs/heads/main',
          job: {
            correlator: 'dependabot-terraform-**-terraform',
            id: '3302222848',
          },
          detector: {
            name: 'dependabot',
            version: '0.349.0-25e6e4a90121d8f8dae0c687f99ccd0aa15a7db6dd1ba623bbee7d766936e0aa',
            url: 'https://github.com/dependabot/dependabot-core',
          },
          manifests: {},
        },
      });

      expect(result).toEqual(true);
    });

    it('should skip processing "create_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependencies': [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should skip processing "create_pull_request" if open pull request limit is reached', async () => {
      const packageManager = 'nuget';
      update['open-pull-requests-limit'] = 1;
      jobBuilderOutput.job['package-manager'] = packageManager;
      existingPullRequests.push({
        pullRequestId: 1,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: packageManager },
          { name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES, value: JSON.stringify({ dependencies: [] }) },
        ],
      } as AzdoPrExtractedWithProperties);

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependencies': [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should process "create_pull_request"', async () => {
      options.autoApprove = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);
      vi.mocked(authorClient.getDefaultBranch).mockResolvedValue('main');
      vi.mocked(approverClient!.approvePullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependencies': [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).toHaveBeenCalled();
      expect(approverClient!.approvePullRequest).toHaveBeenCalled();
    });

    it('should use merged multi-ecosystem group settings when finalizing a pull request', async () => {
      options.config = {
        'version': 2,
        'multi-ecosystem-groups': {
          infrastructure: {
            'schedule': { interval: 'weekly' },
            'assignees': ['@platform-team'],
            'labels': ['infrastructure'],
            'milestone': '42',
            'target-branch': 'release/1.x',
            'pull-request-branch-name': { separator: '-' },
          },
        },
        'updates': [],
      } as unknown as DependabotConfig;
      update = {
        'package-ecosystem': 'docker',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
        'assignees': ['@docker-admin'],
        'labels': ['docker'],
      };

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        unit: makeMultiEcosystemExecutionUnit([update]),
        update,
        job: { ...jobBuilderOutput.job, 'package-manager': 'docker', 'multi-ecosystem-update': true },
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'nginx', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();

      const finalized = await server.finalizeCreateRequests(makeMultiEcosystemExecutionUnit([update]));

      expect(finalized).toEqual({ success: true, affectedPrs: [11] });
      expect(authorClient.getDefaultBranch).not.toHaveBeenCalled();
      expect(authorClient.createPullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { branch: 'release/1.x' },
          assignees: ['@platform-team', '@docker-admin'],
          labels: ['infrastructure', 'docker'],
          workItems: ['42'],
          title: 'chore(deps): Bump the "infrastructure" group with 1 updates across multiple ecosystems',
          source: expect.objectContaining({
            branch: expect.stringMatching(/^dependabot-infrastructure-[a-f0-9]{10}$/),
          }),
        }),
      );
    });

    it('should aggregate multi-ecosystem create requests by execution unit', async () => {
      options.config = {
        'version': 2,
        'multi-ecosystem-groups': {
          infrastructure: {
            schedule: { interval: 'weekly' },
          },
        },
        'updates': [],
      } as unknown as DependabotConfig;

      const dockerUpdate = {
        'package-ecosystem': 'docker',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
      } as DependabotUpdate;
      const terraformUpdate = {
        'package-ecosystem': 'terraform',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
      } as DependabotUpdate;

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: 'docker-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: dockerUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'docker-job',
          'package-manager': 'docker',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });
      server.add({
        id: 'terraform-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: terraformUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'terraform-job',
          'package-manager': 'terraform',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token-2',
        credentialsToken: 'test-creds-token-2',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);
      vi.mocked(authorClient.getDefaultBranch).mockResolvedValue('main');

      await (server as any).handle('docker-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update docker dependency',
          'pr-body': 'Docker body',
          'pr-title': 'Docker PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'nginx', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });
      await (server as any).handle('terraform-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update terraform dependency',
          'pr-body': 'Terraform body',
          'pr-title': 'Terraform PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'hashicorp/aws', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });

      expect(server.createRequests('infrastructure')).toMatchObject([
        { id: 'docker-job', packageManager: 'docker', update: dockerUpdate },
        { id: 'terraform-job', packageManager: 'terraform', update: terraformUpdate },
      ]);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();

      const finalized = await server.finalizeCreateRequests(
        makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
      );

      expect(finalized).toEqual({ success: true, affectedPrs: [11] });
      expect(authorClient.createPullRequest).toHaveBeenCalledTimes(1);
      expect(authorClient.createPullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'chore(deps): Bump the "infrastructure" group with 2 updates across multiple ecosystems',
          commitMessage: 'Update docker dependency',
          description: 'Docker body\n\nTerraform body',
          source: expect.objectContaining({
            branch: expect.stringMatching(/^dependabot-infrastructure-[a-f0-9]{10}$/),
          }),
          properties: expect.arrayContaining([
            { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS, value: JSON.stringify(['docker', 'terraform']) },
            { name: PR_PROPERTY_DEPENDABOT_MULTI_ECOSYSTEM_GROUP_NAME, value: 'infrastructure' },
          ]),
        }),
      );
    });

    it('should ignore unrelated ecosystem PRs when enforcing the grouped open pull requests limit', async () => {
      options.config = {
        'version': 2,
        'multi-ecosystem-groups': {
          infrastructure: {
            schedule: { interval: 'weekly' },
          },
        },
        'updates': [],
      } as unknown as DependabotConfig;

      const dockerUpdate = {
        'package-ecosystem': 'docker',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
        'open-pull-requests-limit': 1,
      } as DependabotUpdate;
      const terraformUpdate = {
        'package-ecosystem': 'terraform',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
        'open-pull-requests-limit': 1,
      } as DependabotUpdate;

      existingPullRequests = [
        {
          pullRequestId: 99,
          properties: [
            { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'docker' },
            {
              name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
              value: JSON.stringify({
                dependencies: [{ 'dependency-name': 'busybox', 'dependency-version': '1.36.0', 'directory': '/' }],
              }),
            },
          ],
        },
      ];
      options.existingPullRequests = existingPullRequests;
      server = new AzureLocalDependabotServer(options);

      server.add({
        id: 'docker-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: dockerUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'docker-job',
          'package-manager': 'docker',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });
      server.add({
        id: 'terraform-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: terraformUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'terraform-job',
          'package-manager': 'terraform',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token-2',
        credentialsToken: 'test-creds-token-2',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);
      vi.mocked(authorClient.getDefaultBranch).mockResolvedValue('main');

      await (server as any).handle('docker-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update docker dependency',
          'pr-body': 'Docker body',
          'pr-title': 'Docker PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'nginx', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });
      await (server as any).handle('terraform-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update terraform dependency',
          'pr-body': 'Terraform body',
          'pr-title': 'Terraform PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'hashicorp/aws', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });

      const finalized = await server.finalizeCreateRequests(
        makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
      );

      expect(finalized).toEqual({ success: true, affectedPrs: [11] });
      expect(authorClient.createPullRequest).toHaveBeenCalledTimes(1);
    });

    it('should truncate multi-ecosystem pull request descriptions to the Azure limit', async () => {
      options.config = {
        'version': 2,
        'multi-ecosystem-groups': {
          infrastructure: {
            schedule: { interval: 'weekly' },
          },
        },
        'updates': [],
      } as unknown as DependabotConfig;

      const dockerUpdate = {
        'package-ecosystem': 'docker',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
      } as DependabotUpdate;
      const terraformUpdate = {
        'package-ecosystem': 'terraform',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
      } as DependabotUpdate;

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: 'docker-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: dockerUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'docker-job',
          'package-manager': 'docker',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });
      server.add({
        id: 'terraform-job',
        unit: makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]),
        update: terraformUpdate,
        job: {
          ...jobBuilderOutput.job,
          'id': 'terraform-job',
          'package-manager': 'terraform',
          'multi-ecosystem-update': true,
        },
        jobToken: 'test-token-2',
        credentialsToken: 'test-creds-token-2',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);
      vi.mocked(authorClient.getDefaultBranch).mockResolvedValue('main');

      await (server as any).handle('docker-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update docker dependency',
          'pr-body': 'A'.repeat(3500),
          'pr-title': 'Docker PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'nginx', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });
      await (server as any).handle('terraform-job', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Update terraform dependency',
          'pr-body': 'B'.repeat(3500),
          'pr-title': 'Terraform PR',
          'updated-dependency-files': [],
          'dependencies': [{ name: 'hashicorp/aws', version: '1.0.0', requirements: [], directory: '/' }],
          'dependency-group': { name: 'infrastructure' },
        },
      });

      await server.finalizeCreateRequests(makeMultiEcosystemExecutionUnit([dockerUpdate, terraformUpdate]));

      expect(authorClient.createPullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.any(String),
        }),
      );
      const description = vi.mocked(authorClient.createPullRequest).mock.calls[0]![0].description!;
      expect(description.length).toBe(PR_DESCRIPTION_MAX_LENGTH);
    });

    it('should skip processing "update_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "update_pull_request" if pull request does not exist', async () => {
      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': ['dependency1'],
        },
      });

      expect(result).toEqual(false);
      expect(authorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should process "update_pull_request"', async () => {
      options.autoApprove = true;
      jobBuilderOutput.job['package-manager'] = 'npm_and_yarn';

      existingPullRequests.push({
        pullRequestId: 11,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'dependency1' }] }),
          },
        ],
      });

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.updatePullRequest).mockResolvedValue(true);
      vi.mocked(approverClient!.approvePullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': ['dependency1'],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.updatePullRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          pullRequestId: 11,
          commit: '1234abcd',
          commitMessage: 'Test commit message',
        }),
      );
      expect(approverClient!.approvePullRequest).toHaveBeenCalled();
    });

    it('should skip processing "close_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': [] },
      });

      expect(result).toEqual(true);
      expect(authorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "close_pull_request" if pull request does not exist', async () => {
      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': ['dependency1'] },
      });

      expect(result).toEqual(false);
      expect(authorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should process "close_pull_request"', async () => {
      jobBuilderOutput.job['package-manager'] = 'npm_and_yarn';
      existingPullRequests.push({
        pullRequestId: 11,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({ dependencies: [{ 'dependency-name': 'dependency1' }] }),
          },
        ],
      });

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.abandonPullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': ['dependency1'] },
      });

      expect(result).toEqual(true);
      expect(authorClient.abandonPullRequest).toHaveBeenCalled();
    });

    it('should process "record_update_job_warning" if "dryRun" is true', async () => {
      options.dryRun = true;

      vi.mocked(authorClient.addCommentThread).mockResolvedValue(1);

      const result = await (server as any).handle('1', {
        type: 'record_update_job_warning',
        data: {
          'warn-type': 'deprecated_dependency',
          'warn-title': 'Deprecated Dependency Used',
          'warn-description': 'The dependency xyz is deprecated and should be updated or removed.',
        },
      });
      expect(result).toEqual(true);
      expect(authorClient.addCommentThread).not.toHaveBeenCalled();
    });

    it('should process "record_update_job_warning"', async () => {
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      // Add the PR id to affectedPullRequestIds so the handler will call addCommentThread
      if (!server['affectedPullRequestIds'].get('1')) {
        server['affectedPullRequestIds'].set('1', { created: [], updated: [], closed: [] });
      }
      server['affectedPullRequestIds'].get('1')!.created.push({
        'pr-number': 11,
        'dependencies': [],
      });

      vi.mocked(authorClient.addCommentThread).mockResolvedValue(1);

      const result = await (server as any).handle('1', {
        type: 'record_update_job_warning',
        data: {
          'warn-type': 'deprecated_dependency',
          'warn-title': 'Deprecated Dependency Used',
          'warn-description': 'The dependency xyz is deprecated and should be updated or removed.',
        },
      });
      expect(result).toEqual(true);
      expect(authorClient.addCommentThread).toHaveBeenCalled();
    });

    it('should process "mark_as_processed"', async () => {
      const result = await (server as any).handle('1', { type: 'mark_as_processed', data: {} });
      expect(result).toEqual(true);
    });

    it('should process "record_ecosystem_versions"', async () => {
      const result = await (server as any).handle('1', { type: 'record_ecosystem_versions', data: {} });
      expect(result).toEqual(true);
    });

    it('should process "increment_metric"', async () => {
      const result = await (server as any).handle('1', {
        type: 'increment_metric',
        data: { metric: 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "record_ecosystem_meta"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_ecosystem_meta',
        data: [{ ecosystem: { name: 'npm_any_yarn' } }],
      });
      expect(result).toEqual(true);
    });

    it('should process "record_cooldown_meta"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_cooldown_meta',
        // data: [{ metric: 'random', value: 1, type: 'increment' }],
      });
      expect(result).toEqual(true);
    });

    it('should process "record_update_job_error"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_update_job_error',
        data: { 'error-type': 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "record_update_job_unknown_error"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_update_job_unknown_error',
        data: { 'error-type': 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "record_metrics"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_metrics',
        data: [{ metric: 'random', value: 1, type: 'increment' }],
      });
      expect(result).toEqual(true);
    });

    it('should handle unknown output type', async () => {
      const result = await (server as any).handle('1', { type: 'non_existant_output_type', data: {} });
      expect(result).toEqual(true);
    });
  });
});
