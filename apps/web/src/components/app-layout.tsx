import { OctagonXIcon } from 'lucide-react';
import type { cookies } from 'next/headers';
import { Suspense } from 'react';

import { stopImpersonating } from '@/actions/auth';
import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import { HelpScoutBeacon } from '@/components/help-scout-beacon';
import { ThemeSelect } from '@/components/theme';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Organization, Session } from '@/lib/auth';
import { environment } from '@/lib/environment';
import { FlagValues, getFlagValues } from '@/lib/flags';

export { dashboardMetadata as metadata } from '@/lib/metadata';

type AppLayoutProps = {
  children: React.ReactNode;
  session?: Session;
  organizations?: (Pick<Organization, 'id' | 'name' | 'slug' | 'type' | 'logo'> & { active: boolean })[];
  breadcrumb?: boolean;
  cookies?: Awaited<ReturnType<typeof cookies>>;
};

export async function AppLayout({ children, session, organizations, breadcrumb = true, cookies }: AppLayoutProps) {
  const slugs = organizations?.map((org) => org.slug);
  const activeOrganization = organizations?.find((org) => org.active);

  const defaultSidebarOpen = cookies ? cookies.get('sidebar_state')?.value === 'true' : undefined;

  return (
    <>
      <WarningBanner session={session} />
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        {session && organizations && <AppSidebar session={session} organizations={organizations} />}
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

function WarningBanner({ session }: { session?: Session }) {
  const sections: { label: string; parts?: string[] }[] = [];

  if (!environment.main || !environment.production) {
    sections.push({
      label: 'Test mode',
      parts: [
        !environment.production && environment.name,
        !environment.main && (environment.branch ?? 'Non-main'),
      ].filter(Boolean) as string[],
    });
  }

  const impersonating = !!session?.session.impersonatedBy;
  if (impersonating) {
    sections.push({
      label: 'Impersonating',
      parts: [session.user.name || session.user.email],
    });
  }

  if (sections.length === 0) return null;

  return (
    <>
      <div className='pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-amber-400/90 dark:bg-amber-500/80' />
      <div className='pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center'>
        {/* The min height is 10 (40px) so that it looks the same as when there is a button */}
        <div className='flex min-h-10 items-center gap-2 rounded-b-xl bg-amber-400/90 p-2 text-xs dark:bg-amber-500/80 '>
          {sections.map((section) => (
            <span key={section.label} className='flex items-center gap-1'>
              <span className='font-semibold'>{section.label}:</span>
              {section.parts ? <span>{section.parts.join(' | ')}</span> : null}
            </span>
          ))}
          {impersonating && (
            <form action={stopImpersonating}>
              <Button
                variant='ghost'
                size='xs'
                type='submit'
                title='Stop impersonating'
                className='pointer-events-auto'
              >
                <OctagonXIcon />
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
