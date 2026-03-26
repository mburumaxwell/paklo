import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createLoader, redirectToParam } from '@/lib/nuqs';

import { SignupForm } from './page.client';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new Paklo account',
  openGraph: { url: `/signup` },
};

export default async function SignupPage(props: PageProps<'/signup'>) {
  const filterSearchParams = {
    redirectTo: redirectToParam(),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { redirectTo } = searchParamsLoader(await props.searchParams);

  // if already logged in, redirect to relevant page
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (session) return redirect(redirectTo);

  return <SignupForm redirectTo={redirectTo} />;
}
