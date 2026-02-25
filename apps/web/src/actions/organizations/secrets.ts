'use server';

import { z } from 'zod';
import { deleteKeyVaultSecret, setKeyVaultSecret } from '@/lib/azure';
import { PakloId } from '@/lib/ids';
import { type OrganizationSecret, prisma } from '@/lib/prisma';
import { RegionCodeSchema } from '@/lib/regions';
import { validateSecretNameFormat } from '@/lib/secrets';
import { createServerAction, ServerActionValidationError } from '@/lib/server-action';

/** Validates if a secret name and its uniqueness within an organization */
export const validateSecretName = createServerAction({
  input: z.object({
    organizationId: z.string(),
    name: z.string().max(255),
    id: z.string().optional(),
  }),
  auth: true,
  handler: async ({ input: { organizationId, name, id } }): Promise<boolean> => {
    const { error } = validateSecretNameFormat(name);
    if (error) throw new ServerActionValidationError(error.message);

    // Check uniqueness within the organization
    const existing = await prisma.organizationSecret.findFirst({
      where: { organizationId, name, NOT: { id } },
    });
    if (existing) {
      throw new ServerActionValidationError('A secret with this name already exists');
    }

    return true;
  },
});

export type OrganizationSecretSafe = Pick<
  OrganizationSecret,
  'id' | 'name' | 'createdAt' | 'updatedAt' | 'description'
>;
function makeSecretResult(secret: OrganizationSecret): OrganizationSecretSafe {
  return {
    id: secret.id,
    name: secret.name,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    description: secret.description,
  };
}

/** Creates a new organization secret */
export const createSecret = createServerAction({
  input: z.object({
    organizationId: z.string(),
    region: RegionCodeSchema,
    name: z.string().max(255),
    value: z.string().max(1024),
    description: z.string().trim().optional(),
  }),
  auth: true,
  handler: async ({ input }): Promise<OrganizationSecretSafe> => {
    const { organizationId, region, name, value, description } = input;
    let secret = await prisma.organizationSecret.create({
      data: {
        id: PakloId.generate('organization_secret'),
        organizationId,
        region,
        name,
      },
    });

    // create the secret in Azure Key Vault
    const url = await setKeyVaultSecret({ region, name: secret.id, value });

    // update the secret with the URL
    secret = await prisma.organizationSecret.update({
      where: { id: secret.id },
      data: { secretUrl: url, description },
    });

    return makeSecretResult(secret);
  },
});

/** Updates an existing organization secret's value */
export const updateSecret = createServerAction({
  input: z.object({
    organizationId: z.string(),
    id: z.string(),
    value: z.string().max(1024),
    description: z.string().trim().optional(),
  }),
  auth: true,
  handler: async ({ input: { organizationId, id, value, description } }): Promise<OrganizationSecretSafe> => {
    let secret = await prisma.organizationSecret.findUniqueOrThrow({
      // organizationId just to make sure it matches the organization
      where: { organizationId, id },
    });

    // update the secret in Azure Key Vault
    let { region, secretUrl: url } = secret;
    if (url) {
      await setKeyVaultSecret({ region, url, value });
      // update the secret in the database
      secret = await prisma.organizationSecret.update({
        // organizationId just to make sure it matches the organization
        where: { organizationId, id },
        data: { description },
      });
    } else {
      // if no URL is set, create a new secret
      url = await setKeyVaultSecret({ region, name: secret.id, value });
      // update the secret with the new URL
      secret = await prisma.organizationSecret.update({
        // organizationId just to make sure it matches the organization
        where: { organizationId, id: secret.id },
        data: { secretUrl: url, description },
      });
    }

    return makeSecretResult(secret);
  },
});

/** Deletes an existing organization secret */
export const deleteSecret = createServerAction({
  input: z.object({ organizationId: z.string(), id: z.string() }),
  auth: true,
  handler: async ({ input: { organizationId, id } }): Promise<boolean> => {
    const secret = await prisma.organizationSecret.findUniqueOrThrow({
      // organizationId just to make sure it matches the organization
      where: { organizationId, id },
    });

    // delete the secret from Azure Key Vault
    const { region, secretUrl: url } = secret;
    if (url) {
      await deleteKeyVaultSecret({ region, url });
    }

    // delete the secret from the database
    await prisma.organizationSecret.delete({
      // organizationId just to make sure it matches the organization
      where: { organizationId, id },
    });
    return true;
  },
});
