import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound, unauthorized } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createLoader, textFilter } from '@/lib/nuqs';

import { InviteAcceptView } from './page.client';

export const metadata: Metadata = {
  title: 'Accept Invitation',
  description: 'Join your organization and start managing projects',
  openGraph: { url: `/invite/accept` },
};

export default async function OrgInviteAcceptPage(props: PageProps<'/invite/accept'>) {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) return unauthorized();

  const filterSearchParams = {
    id: textFilter(),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { id } = searchParamsLoader(await props.searchParams);

  const invitationId = Array.isArray(id) ? id[0] : id;
  if (!invitationId) return notFound();

  return <InviteAcceptView invitationId={invitationId} />;
}
