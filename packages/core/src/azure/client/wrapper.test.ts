/* oxlint-disable typescript/no-explicit-any */

import ky from 'ky';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractRepositoryUrl } from '../url-parts';
import { AzureDevOpsClientWrapper, commitsAreAuthoredBy } from './wrapper';

vi.mock('ky');

describe('AzureDevOpsClientWrapper', () => {
  const url = extractRepositoryUrl({
    organizationUrl: 'https://dev.azure.com/mock-organization',
    project: 'project',
    repository: 'repository',
  });
  const accessToken = 'mock-access-token';
  let client: AzureDevOpsClientWrapper;
  let mockKyInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock ky instance
    mockKyInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    // Mock ky.create to return our mock instance
    vi.mocked(ky.create).mockReturnValue(mockKyInstance as any);

    client = new AzureDevOpsClientWrapper(url, accessToken);
  });

  describe('createPullRequest', () => {
    it('should create a pull request without duplicate reviewer and assignee identities', async () => {
      // Arrange
      vi.spyOn(client, 'getUserId').mockResolvedValue('my-user-id');
      vi.spyOn(client, 'resolveIdentityId').mockImplementation(async (identity?: string) => {
        return identity || '';
      });

      // Mock the push (first POST call)
      mockKyInstance.post.mockReturnValueOnce({
        json: vi.fn().mockResolvedValue({ commits: [{ commitId: 'new-commit-id' }] }),
      });

      // Mock the create PR (second POST call)
      let capturedReviewers: any;
      mockKyInstance.post.mockReturnValueOnce({
        json: vi.fn().mockImplementation(async () => {
          // Capture the reviewers from the call
          const calls = mockKyInstance.post.mock.calls;
          const createPrCall = calls.find((call: any[]) => call[0]?.includes('/pullrequests'));
          if (createPrCall?.[1]?.json?.reviewers) {
            capturedReviewers = createPrCall[1].json.reviewers;
          }
          return { pullRequestId: 1 };
        }),
      });

      // Mock the properties patch
      mockKyInstance.patch.mockReturnValueOnce({
        json: vi.fn().mockResolvedValue({ count: 1 }),
      });

      // Act
      const pullRequestId = await client.createPullRequest({
        project: 'project',
        repository: 'repository',
        source: { branch: 'update-branch', commit: 'commit-id' },
        target: { branch: 'main' },
        author: { name: 'Author Name', email: 'author@example.com' },
        title: 'PR Title',
        description: 'PR Description',
        commitMessage: 'Commit Message',
        changes: [
          {
            path: 'file.txt',
            content: 'hello world',
            encoding: 'utf-8',
            changeType: 'add',
          },
        ],
        assignees: ['user1', 'user2'],
      });

      // Assert
      expect(mockKyInstance.post).toHaveBeenCalledTimes(2);
      expect(capturedReviewers).toBeDefined();
      expect(capturedReviewers.length).toBe(2);
      expect(capturedReviewers).toContainEqual({ id: 'user1' });
      expect(capturedReviewers).toContainEqual({ id: 'user2' });
      expect(pullRequestId).toBe(1);
    });
  });

  describe('updatePullRequest', () => {
    it('uses the provided commit message when pushing refreshed changes', async () => {
      mockKyInstance.get
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({
            pullRequestId: 1,
            status: 'active',
            isDraft: false,
            sourceRefName: 'refs/heads/dependabot/npm_and_yarn/pkg-2.0.0',
            targetRefName: 'refs/heads/main',
            title: 'Old title',
            lastMergeCommit: { commitId: 'merge-commit-id' },
            lastMergeSourceCommit: { commitId: 'old-source-commit-id' },
            mergeStatus: 'succeeded',
          }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({
            value: [{ author: { name: 'Author Name', email: 'author@example.com' } }],
          }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ aheadCount: 0, behindCount: 1 }),
        });
      mockKyInstance.post
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ value: [{ success: true }] }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ commits: [{ commitId: 'new-commit-id' }] }),
        });

      const updated = await client.updatePullRequest({
        project: 'project',
        repository: 'repository',
        pullRequestId: 1,
        commit: 'base-commit-id',
        author: { name: 'Author Name', email: 'author@example.com' },
        commitMessage: 'build: bump openai from 1.63.0 to 1.84.0',
        changes: [
          {
            path: 'package.json',
            content: '{"dependencies":{"openai":"1.84.0"}}',
            encoding: 'utf-8',
            changeType: 'edit',
          },
        ],
      });

      expect(updated).toBe(true);

      const pushCall = mockKyInstance.post.mock.calls.find((call: any[]) => call[0]?.includes('/pushes'));
      expect(pushCall?.[1]?.json?.commits?.[0]?.comment).toBe('build: bump openai from 1.63.0 to 1.84.0');
    });

    it('falls back to the rebase message when the regenerated commit message is missing', async () => {
      mockKyInstance.get
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({
            pullRequestId: 1,
            status: 'active',
            isDraft: false,
            sourceRefName: 'refs/heads/dependabot/npm_and_yarn/pkg-2.0.0',
            targetRefName: 'refs/heads/main',
            title: 'Old title',
            lastMergeCommit: { commitId: 'merge-commit-id' },
            lastMergeSourceCommit: { commitId: 'old-source-commit-id' },
            mergeStatus: 'succeeded',
          }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({
            value: [{ author: { name: 'Author Name', email: 'author@example.com' } }],
          }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ aheadCount: 0, behindCount: 1 }),
        });
      mockKyInstance.post
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ value: [{ success: true }] }),
        })
        .mockReturnValueOnce({
          json: vi.fn().mockResolvedValue({ commits: [{ commitId: 'new-commit-id' }] }),
        });

      const updated = await client.updatePullRequest({
        project: 'project',
        repository: 'repository',
        pullRequestId: 1,
        commit: 'base-commit-id',
        author: { name: 'Author Name', email: 'author@example.com' },
        changes: [
          {
            path: 'package.json',
            content: '{"dependencies":{"openai":"1.84.0"}}',
            encoding: 'utf-8',
            changeType: 'edit',
          },
        ],
      });

      expect(updated).toBe(true);

      const pushCall = mockKyInstance.post.mock.calls.findLast((call: any[]) => call[0]?.includes('/pushes'));
      expect(pushCall?.[1]?.json?.commits?.[0]?.comment).toBe("Rebase 'dependabot/npm_and_yarn/pkg-2.0.0' onto 'main'");
    });
  });
});

describe('commitsAreAuthoredBy', () => {
  it('allows multiple commits from the same author email', () => {
    expect(
      commitsAreAuthoredBy(
        [
          { author: { name: 'Author', email: 'author@example.com' } },
          { author: { name: 'Author', email: 'author@example.com' } },
        ],
        { email: 'author@example.com' },
      ),
    ).toBe(true);
  });

  it('rejects commits from another author email', () => {
    expect(
      commitsAreAuthoredBy(
        [
          { author: { name: 'Author', email: 'author@example.com' } },
          { author: { name: 'Other', email: 'other@example.com' } },
        ],
        { email: 'author@example.com' },
      ),
    ).toBe(false);
  });
});
