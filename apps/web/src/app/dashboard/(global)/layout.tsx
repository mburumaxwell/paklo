import { cookies as cookieStore, headers as requestHeaders } from 'next/headers';

import { AppLayout } from '@/components/app-layout';
import { auth } from '@/lib/auth';

export { dashboardMetadata as metadata } from '@/lib/metadata';

export default async function Layout({ children }: LayoutProps<'/dashboard'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;

  const cookies = await cookieStore();

  return (
    <AppLayout session={session} cookies={cookies}>
      {children}
    </AppLayout>
  );
}
