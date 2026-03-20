import Script from 'next/script';

import type { Organization, Session } from '@/lib/auth-client';

type HelpScoutBeaconProps = {
  session?: Session;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'type' | 'logo'>;
};

export function HelpScoutBeacon({ session, organization }: HelpScoutBeaconProps) {
  const beaconId = process.env.NEXT_PUBLIC_HELP_SCOUT_BEACON_ID!;
  const user = session?.user;
  const identify = user ? { email: user.email, name: user.name } : null;
  const sessionData = organization?.name ? { Organization: organization.name } : null;

  return (
    <>
      <Script id='helpscout-beacon-stub' strategy='afterInteractive'>
        {`
          window.Beacon = window.Beacon || function(method, options, data) {
            window.Beacon.readyQueue = window.Beacon.readyQueue || [];
            window.Beacon.readyQueue.push({ method: method, options: options, data: data });
          };
        `}
      </Script>
      <Script id='helpscout-beacon-source' src='https://beacon-v2.helpscout.net' strategy='afterInteractive' />
      <Script id='helpscout-beacon-init' strategy='afterInteractive'>
        {`
          window.__helpScoutBeaconInitialized = window.__helpScoutBeaconInitialized || false;
          if (!window.__helpScoutBeaconInitialized) {
            window.Beacon('init', '${beaconId}');
            window.__helpScoutBeaconInitialized = true;
          }
          ${identify ? `window.Beacon('identify', ${JSON.stringify(identify)});` : ''}
          ${sessionData ? `window.Beacon('session-data', ${JSON.stringify(sessionData)});` : ''}
        `}
      </Script>
    </>
  );
}
