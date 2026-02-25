'use server';

import { ANONYMOUS_USER_ID, type AzureDevOpsOrganizationUrl, extractOrganizationUrl } from '@paklo/core/azure';
import { createGitHubClient } from '@paklo/core/github';
import { RequestError } from 'octokit';
import { z } from 'zod';
import { createAzdoClient } from '@/integrations';
import { setKeyVaultSecret } from '@/lib/azure';
import { OrganizationTypeSchema } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import { createServerAction, ServerActionValidationError } from '@/lib/server-action';

export const validateOrganizationCredentials = createServerAction({
  input: z.object({
    type: OrganizationTypeSchema,
    url: z.url(),
    token: z.string().min(32).max(128),
    /** Optional organization ID to exclude from uniqueness check */
    id: z.string().optional(),
  }),
  auth: true,
  handler: async ({ input: { type, url: inputUrl, token, id } }): Promise<boolean> => {
    // ensure the URL can be parsed
    let url: AzureDevOpsOrganizationUrl;
    try {
      url = extractOrganizationUrl({ organizationUrl: inputUrl });
    } catch (_error) {
      throw new ServerActionValidationError('Invalid URL format');
    }

    // ensure the token is valid and is not anonymous
    let userId: string;
    const client = await createAzdoClient({ url, token });
    try {
      userId = (await client.connection.get()).authenticatedUser.id;

      if (!userId || userId === ANONYMOUS_USER_ID) {
        throw new ServerActionValidationError('Invalid credentials provided');
      }
    } catch (_error) {
      throw new ServerActionValidationError(
        'Failed to connect to Azure DevOps with provided credentials. Please check your URL.',
      );
    }

    // TODO: check for all needed permissions here so that we ensure it will keep working

    // ensure there is no other organization with the same URL
    const existing = await prisma.organization.findFirst({
      where: {
        type,
        url: inputUrl,
        // exclude current organization from uniqueness check
        NOT: id ? { id } : undefined,
      },
    });
    if (existing) {
      throw new ServerActionValidationError('An organization with the provided URL already exists');
    }

    return true;
  },
});

export const validateGitHubToken = createServerAction({
  input: z.object({ token: z.string().min(32).max(128) }),
  auth: true,
  handler: async ({ input: { token } }): Promise<boolean> => {
    try {
      const octokit = createGitHubClient({ token });

      // Ensure the token works by fetching the authenticated user's information
      await octokit.rest.users.getAuthenticated();

      // Check if the token has the required 'repo' scope
      try {
        await octokit.rest.repos.listForAuthenticatedUser({
          per_page: 1,
          type: 'all',
        });
      } catch (error) {
        // If we can get user info but not repos, the token might not have repo scope
        if (error instanceof Error && error.message.includes('403')) {
          throw new ServerActionValidationError(
            'Token is valid but missing required "repo" scope. Please ensure your token has repository access permissions.',
          );
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof RequestError) {
        if (error.status === 401) {
          throw new ServerActionValidationError('Invalid token. Please check your GitHub personal access token.');
        }
        if (error.status === 403) {
          throw new ServerActionValidationError(
            'Token has insufficient permissions. Please ensure it has the required scopes.',
          );
        }
        if (error.status === 429) {
          throw new ServerActionValidationError('Rate limit exceeded. Please try again later.');
        }

        throw new ServerActionValidationError(`GitHub API error: ${error.message} (status: ${error.status})`);
      }

      throw new ServerActionValidationError(`Token validation failed: ${(error as Error).message}`);
    }

    return true;
  },
});

export const updateOrganizationToken = createServerAction({
  input: z.object({ id: z.string(), token: z.string().min(32).max(128) }),
  auth: true,
  handler: async ({ input: { id, token } }): Promise<boolean> => {
    await prisma.organizationCredential.update({
      where: { id },
      data: { token },
    });

    return true;
  },
});

export const updateGithubToken = createServerAction({
  input: z.object({ id: z.string(), token: z.string().min(32).max(128) }),
  auth: true,
  handler: async ({ input: { id, token } }): Promise<boolean> => {
    // fetch organization
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id } });

    // fetch credential
    const credential = await prisma.organizationCredential.findUniqueOrThrow({
      where: { id },
    });

    // update the token in Azure Key Vault
    const { region } = organization;
    let { githubTokenSecretUrl: url } = credential;
    if (url) {
      await setKeyVaultSecret({ region, url, value: token });
    } else {
      // create a new secret in Azure Key Vault
      url = await setKeyVaultSecret({ region, name: `github-${credential.id}`, value: token });

      // update the credential with the URL
      await prisma.organizationCredential.update({
        where: { id },
        data: { githubTokenSecretUrl: url },
      });
    }

    return true;
  },
});
