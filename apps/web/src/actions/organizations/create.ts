'use server';

import { extractOrganizationUrl } from '@paklo/core/azure';
import { Keygen } from '@paklo/core/keygen';
import { z } from 'zod';

import { type Organization, auth } from '@/lib/auth';
import { type OrganizationType, OrganizationTypeSchema } from '@/lib/enums';
import { prisma } from '@/lib/prisma';
import { type RegionCode, RegionCodeSchema } from '@/lib/regions';
import { createServerAction } from '@/lib/server-action';

export type OrganizationCreateOptions = {
  name: string;
  slug: string;
  type: OrganizationType;
  url: string;
  token: string;
  region: RegionCode;
};

export const createOrganizationWithCredential = createServerAction({
  input: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100),
    type: OrganizationTypeSchema,
    url: z.url(),
    token: z.string().trim().min(32).max(128),
    region: RegionCodeSchema,
  }),
  auth: true,
  handler: async ({ context: { headers }, input }): Promise<Organization> => {
    const { name, slug, type, url, token, region } = input;
    const organization = await auth.api.createOrganization({
      headers,
      body: {
        name,
        slug,
        type,
        url,
        region,
        ...getProviderStuff(input),
      },
    });

    if (!organization) {
      throw new Error('Failed to create organization');
    }

    // generate webhook token
    const webhooksToken = Keygen.generate({ length: 32, encoding: 'base62' });

    // create organization credential
    await prisma.organizationCredential.create({
      data: { id: organization.id, token, webhooksToken },
    });

    return organization;
  },
});

type GetProviderStuffResult = Pick<Organization, 'providerHostname' | 'providerApiEndpoint'>;
function getProviderStuff({ type, url: organizationUrl }: OrganizationCreateOptions): GetProviderStuffResult {
  let hostname: string;
  let apiEndpoint: string;

  switch (type) {
    case 'azure': {
      const url = extractOrganizationUrl({ organizationUrl });
      hostname = url.hostname;
      apiEndpoint = url['api-endpoint'];
      break;
    }
    default:
      throw new Error(`Unsupported organization type: ${type}`);
  }

  return { providerHostname: hostname, providerApiEndpoint: apiEndpoint };
}
