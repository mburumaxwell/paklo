'use client';

import { MailIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { ExternalLoginButtons } from '@/components/auth-buttons';
import { PakloIcon } from '@/components/logos';
import { Controller, useForm, zodResolver } from '@/components/rhf';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useMounted } from '@/hooks/use-mounted';
import { magicLinkLogin } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { z } from '@/lib/zod';

interface SignupFormProps extends React.ComponentProps<'div'> {
  redirectTo: Route;
}

export function SignupForm({ className, redirectTo, ...props }: SignupFormProps) {
  const mounted = useMounted();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);

  const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email address'),
  });
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { name: '', email: '' } });

  async function handleSignup(values: z.infer<typeof formSchema>) {
    setLoading(true);
    let error: { code?: string; message?: string } | null = null;
    let data: { status: boolean } | null = null;
    try {
      ({ data, error } = await magicLinkLogin({ ...values, callbackURL: redirectTo }));
    } catch (err) {
      error = { message: (err as Error).message };
    }
    setLoading(false);

    if (error || !data?.status) {
      toast.error('Failed to send magic link.', { description: error?.message || 'Please try again.' });
      setMagicLinkSent(false);
      return;
    }

    setMagicLinkSent(true);
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-2 text-center'>
          <Link href='/' className='flex flex-col items-center gap-2 font-medium'>
            <div className='flex size-8 items-center justify-center rounded-md'>
              <PakloIcon className='size-6' />
            </div>
            <span className='sr-only'>Paklo</span>
          </Link>
          <h1 className='text-xl font-bold'>Welcome to Paklo Dashboard</h1>
          <FieldDescription>
            Already have an account? <Link href='/login'>Login</Link>
          </FieldDescription>
        </div>
      </FieldGroup>
      {magicLinkSent ? (
        <Empty>
          <EmptyMedia variant='icon'>
            <MailIcon />
          </EmptyMedia>
          <EmptyTitle>Check your email</EmptyTitle>
          <EmptyDescription>
            We sent a magic link to your email. Click the link to complete your signup and login.
          </EmptyDescription>
        </Empty>
      ) : (
        <form className='space-y-4' onSubmit={form.handleSubmit(handleSignup)}>
          <Controller
            control={form.control}
            name='name'
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor='name'>Name</FieldLabel>
                <Input {...field} id='name' type='text' placeholder='Chris Johnson' disabled={loading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='email'
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  {...field}
                  id='email'
                  type='email'
                  placeholder='chris.johnson@contoso.com'
                  autoCapitalize='none'
                  autoComplete='email'
                  autoCorrect='off'
                  disabled={loading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Field>
            <Button type='submit' disabled={loading}>
              {loading && <Spinner />}
              {!loading && (
                <>
                  <MailIcon />
                  Continue with email
                </>
              )}
            </Button>
          </Field>
        </form>
      )}
      <FieldSeparator />
      <FieldGroup>
        <Field className='grid md:grid-cols-2'>
          <ExternalLoginButtons mounted={mounted} loading={loading} setLoading={setLoading} redirectTo={redirectTo} />
        </Field>
      </FieldGroup>
      <FieldSeparator />
      <FieldDescription className='text-center text-xs'>
        By continuing, you agree to our{' '}
        <Link href='/legal/terms' target='_blank' rel='noreferrer'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href='/legal/privacy' target='_blank' rel='noreferrer'>
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
