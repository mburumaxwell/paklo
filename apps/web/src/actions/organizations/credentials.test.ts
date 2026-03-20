import { describe, expect, it, vi } from 'vitest';

import { validateGitHubToken } from './credentials';

// Mock Next.js headers and auth
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => ({ user: { id: 'test-user' } })),
    },
  },
}));

describe('validateGitHubToken', () => {
  describe('real API', async () => {
    it('returns invalid for malformed token', async () => {
      const result = await validateGitHubToken({ token: 'a'.repeat(40) }); // properly-sized but invalid token
      expect(result.data).toBeUndefined();
      expect(result.error?.message).toBe('Invalid token. Please check your GitHub personal access token.');
    }, 2000);

    it('works with a real token', async () => {
      // provide a valid token via GITHUB_TOKEN environment variable or replace the placeholder below
      const token = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
      if (token === 'YOUR_GITHUB_TOKEN_HERE') {
        console.log('Skipping real API test - set GITHUB_TOKEN environment variable to run this test');
        return;
      }

      const result = await validateGitHubToken({ token });
      expect(result.data).toBe(true);
      expect(result.error).toBeUndefined();
    }, 2000);
  });
});
