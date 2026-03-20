import type { cookies } from 'next/headers';
import { Suspense } from 'react';

import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import { HelpScoutBeacon } from '@/components/help-scout-beacon';
import { ThemeSelect } from '@/components/theme';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Organization, Session } from '@/lib/auth';
import { FlagValues, getFlagValues } from '@/lib/flags';

export { dashboardMetadata as metadata } from '@/lib/metadata';

type AppLayoutProps = {
  children: React.ReactNode;
  session?: Session;
  organizations?: (Pick<Organization, 'id' | 'name' | 'slug' | 'type' | 'logo'> & { active: boolean })[];
  breadcrumb?: boolean;
  cookies?: Awaited<ReturnType<typeof cookies>>;
};

export async function AppLayout({ children, session, organizations = [], breadcrumb = true, cookies }: AppLayoutProps) {
  const slugs = organizations.map((org) => org.slug);
  const activeOrganization = organizations.find((org) => org.active);

  const defaultSidebarOpen = cookies ? cookies.get('sidebar_state')?.value === 'true' : undefined;

  return (
    <>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        {session && <AppSidebar session={session} organizations={organizations} />}
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            {session && (
              <>
                <SidebarTrigger className='-ml-1' />
                <div>
                  <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
                </div>
                {breadcrumb && <AppBreadcrumb omit={slugs} />}
              </>
            )}
            <div className='ml-auto'>
              <ThemeSelect />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
      <Suspense fallback={null}>
        <FlagValues values={await getFlagValues()} />
      </Suspense>
      <HelpScoutBeacon session={session} organization={activeOrganization} />
    </>
  );
}
