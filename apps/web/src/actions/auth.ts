'use server';

import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

/**
 * Ends an active admin impersonation session and restores the original admin session.
 *
 * This lives in a module-level server action instead of inline in `dashboard/layout.tsx`
 * because form-bound server actions are more stable when exported from a file like this,
 * especially during development when layouts are edited and recompiled.
 *
 * This also intentionally does not use `createServerAction`: the auth plugin already
 * performs its own session validation and impersonation checks, and this action only
 * needs to forward the request headers and then redirect back to the dashboard.
 */
export async function stopImpersonating() {
  const headers = await requestHeaders();
  await auth.api.stopImpersonating({ headers });
  redirect('/dashboard');
}
