import type { Metadata, Route } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from './form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your paklo account',
  openGraph: { url: `/login` },
};

export default async function LoginPage(props: PageProps<'/login'>) {
  // if already logged in, redirect to relevant page
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (session) return redirect('/dashboard');

  const searchParams = (await props.searchParams) as {
    redirectTo?: Route;
  };
  const { redirectTo = '/dashboard' } = searchParams;

  return <LoginForm redirectTo={redirectTo} />;
}
