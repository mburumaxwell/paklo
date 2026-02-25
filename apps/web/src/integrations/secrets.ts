import { deleteKeyVaultSecret, getKeyVaultSecret } from '@/lib/azure';
import { type Organization, prisma } from '@/lib/prisma';
import type { RegionCode } from '@/lib/regions';

/**
 * Retrieves the value of an organization secret.
 * @note This should only be called server-side when triggering jobs.
 */
export async function getSecretValue({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}): Promise<string | undefined> {
  const secret = await prisma.organizationSecret.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (!secret || !secret.secretUrl) return undefined;

  return getKeyVaultSecret({ region: secret.region, url: secret.secretUrl });
}

export type GetGithubTokenOptions =
  | {
      /** The ID of the organization for which to get the token */
      id: string;
    }
  | {
      /** The organization for which to get the token */
      organization: Pick<Organization, 'id' | 'region'>;
    };
export async function getGithubToken(options: GetGithubTokenOptions): Promise<string | undefined> {
  const { id, region } = await getOrganizationIdAndRegion(options);

  // fetch credential
  const credential = await prisma.organizationCredential.findUnique({
    where: { id },
  });
  if (!credential || !credential.githubTokenSecretUrl) return undefined;

  // fetch the secret from Azure Key Vault
  return await getKeyVaultSecret({ region, url: credential.githubTokenSecretUrl });
}

export async function deleteGithubToken(options: GetGithubTokenOptions): Promise<void> {
  const { id, region } = await getOrganizationIdAndRegion(options);

  // fetch credential
  const credential = await prisma.organizationCredential.findUnique({
    where: { id },
  });
  if (!credential) return;

  // if there is a secret URL, delete the secret from Azure Key Vault
  if (credential.githubTokenSecretUrl) {
    await deleteKeyVaultSecret({ region, url: credential.githubTokenSecretUrl });
  }

  // update the credential to remove the secret URL
  await prisma.organizationCredential.update({
    where: { id },
    data: { githubTokenSecretUrl: null },
  });
}

export async function getOrganizationIdAndRegion(
  options: GetGithubTokenOptions,
): Promise<{ id: string; region: RegionCode }> {
  const id = 'id' in options ? options.id : options.organization.id;
  let region: RegionCode | undefined;
  if ('organization' in options) {
    region = options.organization.region;
  } else {
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id } });
    region = organization.region;
  }
  return { id, region };
}
