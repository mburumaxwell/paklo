'use server';

import { headers as requestHeaders } from 'next/headers';
import { z } from 'zod';
import { deleteGithubToken } from '@/integrations';
import { auth } from '@/lib/auth';
import { deleteKeyVaultSecret } from '@/lib/azure';
import { stripe } from '@/lib/billing';
import { prisma } from '@/lib/prisma';
import { createServerAction, ServerActionValidationError } from '@/lib/server-action';

export const deleteOrganization = createServerAction({
  input: z.object({ organizationId: z.string() }),
  auth: true,
  handler: async ({ input: { organizationId } }): Promise<boolean> => {
    // fetch organization so that we can delete billing first
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

    // the organization should not have any projects
    const projectCount = await prisma.project.count({ where: { organizationId: organization.id } });
    if (projectCount > 0) {
      throw new ServerActionValidationError('Organization still has projects. Please delete them first.');
    }

    // the organization should not have an active subscription
    if (organization.subscriptionId) {
      throw new ServerActionValidationError('Organization has an active subscription. Please cancel it first.');
    }

    // if organization has a customerId, delete the customer
    if (organization.customerId) {
      try {
        await stripe.customers.del(organization.customerId);
      } catch (error) {
        // it was already deleted
        if (!(error instanceof stripe.errors.StripeInvalidRequestError)) {
          throw new Error('Failed to delete organization billing.');
        }
      }
      // update org to remove customer
      await prisma.organization.update({ where: { id: organizationId }, data: { customerId: null } });
    }

    // delete secrets from key vault
    const secrets = await prisma.organizationSecret.findMany({
      where: { organizationId: organization.id, secretUrl: { not: null } },
    });
    await Promise.all(secrets.map(({ region, secretUrl }) => deleteKeyVaultSecret({ region, url: secretUrl! })));

    // delete credentials from key vault
    await deleteGithubToken({ organization });

    // finally delete the organization
    const headers = await requestHeaders();
    await auth.api.deleteOrganization({ headers, body: { organizationId: organizationId } });
    return true;
  },
});
