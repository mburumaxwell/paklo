import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { unauthorized } from 'next/navigation';

import { auth } from '@/lib/auth';

import { DangerSection, OrganizationsSection, ProfileSection, SecuritySection, SessionsSection } from './page.client';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your Paklo account',
  openGraph: { url: `/dashboard/account` },
};

export default async function AccountPage() {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) return unauthorized();

  const [accounts, sessions, passkeys, organizations] = await Promise.all([
    auth.api.listUserAccounts({ headers }),
    auth.api.listSessions({ headers }),
    auth.api.listPasskeys({ headers }),
    auth.api.listOrganizations({ headers }),
  ]);

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <div>
        <h1 className='mb-2 text-3xl font-semibold'>Account Settings</h1>
        <p className='text-muted-foreground'>Manage your account preferences and security settings</p>
      </div>

      <ProfileSection user={session.user} />
      <SecuritySection user={session.user} passkeys={passkeys} accounts={accounts} />
      <SessionsSection activeSessionId={session.session.id} sessions={sessions} />
      <OrganizationsSection organizations={organizations} />
      <DangerSection userId={session.user.id} hasOrganizations={organizations.length > 0} />
    </div>
  );
}
