import { cookies as cookieStore, headers as requestHeaders } from 'next/headers';
import { forbidden, unauthorized } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { auth } from '@/lib/auth';

export { dashboardMetadata as metadata } from '@/lib/metadata';

export default async function Layout({ children, params }: LayoutProps<'/dashboard/[org]'>) {
  const { org: organizationSlug } = await params;
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) return unauthorized();

  const organizations = (await auth.api.listOrganizations({ headers })).map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    logo: org.logo,
    active: org.slug === organizationSlug,
  }));
  // ensure user has access to the organization in the url
  if (!organizations.find((org) => org.active)) return forbidden();

  const cookies = await cookieStore();
  return (
    <AppLayout session={session} organizations={organizations} cookies={cookies}>
      {children}
    </AppLayout>
  );
}
