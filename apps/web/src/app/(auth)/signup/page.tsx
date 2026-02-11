import type { Metadata, Route } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignupForm } from './form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new Paklo account',
  openGraph: { url: `/signup` },
};

export default async function SignupPage(props: PageProps<'/signup'>) {
  // if already logged in, redirect to relevant page
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (session) return redirect('/dashboard');

  const searchParams = (await props.searchParams) as {
    redirectTo?: Route;
  };
  const { redirectTo = '/dashboard' } = searchParams;

  return <SignupForm redirectTo={redirectTo} />;
}
