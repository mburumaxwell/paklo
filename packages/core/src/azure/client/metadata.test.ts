import { describe, expect, it } from 'vitest';

import { PR_PROPERTY_DEPENDABOT_DEPENDENCIES, PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS } from './constants';
import { getPullRequestMetadata } from './metadata';

describe('getPullRequestMetadata', () => {
  it('builds metadata from persisted pull request properties', async () => {
    const metadata = await getPullRequestMetadata(
      {
        pullRequestId: 123,
        targetRefName: 'refs/heads/main',
        description: 'Bumps lodash.\n\nMaintainer changes',
        commitMessage: `Bump frontend dependencies

---
updated-dependencies:
- dependency-name: lodash
  dependency-type: direct:production
  dependency-version: 4.17.21
- dependency-name: express
  dependency-type: indirect
  dependency-version: 4.18.2
...
`,
        properties: [
          { name: PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGERS, value: JSON.stringify(['npm_and_yarn']) },
          {
            name: PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify({
              'dependency-group-name': 'frontend',
              'dependencies': [
                {
                  'dependency-name': 'lodash',
                  'previous-version': '3.10.1',
                  'dependency-version': '4.17.21',
                  'directory': '/web',
                },
                {
                  'dependency-name': 'express',
                  'previous-version': '4.17.1',
                  'dependency-version': '4.18.2',
                  'directory': '/api',
                },
              ],
            }),
          },
        ],
      },
      async () => 0,
    );

    expect(metadata['dependency-names']).toBe('lodash, express');
    expect(metadata['dependency-type']).toBe('direct:production');
    expect(metadata['package-ecosystem']).toBe('npm');
    expect(metadata['target-branch']).toBe('main');
    expect(metadata['dependency-group']).toBe('frontend');
    expect(metadata['maintainer-changes']).toBe(true);
  });

  it('throws a clear error when pull request metadata is missing', async () => {
    await expect(
      getPullRequestMetadata({
        pullRequestId: 123,
        properties: [],
      }),
    ).rejects.toThrow("No Dependabot metadata was found on pull request '123'.");
  });
});
