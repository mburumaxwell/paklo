'use client';

import { UserKeyIcon } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import type { Icon } from '@/components/icons';
import { GitHubLogo, MicrosoftLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';

interface Provider {
  id: string;
  label: string;
  icon: Icon;
  manageUrl: string;
  disabled?: boolean;
}
export const providers: Provider[] = [
  {
    id: 'microsoft',
    label: 'Microsoft',
    icon: MicrosoftLogo,
    manageUrl: 'https://myaccount.microsoft.com/security-info',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: GitHubLogo,
    manageUrl: 'https://github.com/settings/applications',
    disabled: true,
  },
  // {
  //   id: 'google',
  //   label: 'Google',
  //   icon: GoogleLogo,
  //   manageUrl: 'https://myaccount.google.com/connections?pli=1',
  //   disabled: true,
  // },
  // { id: 'apple', label: 'Apple', icon: AppleLogo, manageUrl: 'https://appleid.apple.com', disabled: true },
];

interface ExternalLoginButtonsProps {
  mounted: boolean;
  loading: boolean;
  setLoading: (value: boolean) => void;
  redirectTo: Route;
  /**
   * Whether to show an indicator for the last used login method.
   * This is optional and can be set to false to hide the indicator.
   *
   * @default true
   * @remarks
   * The last used login method is determined based on the user's most recent successful authentication and may not always be accurate,
   * especially if the user clears their cookies or uses multiple devices. Use with caution and consider the user experience implications of showing this indicator.
   */
  lastUsedIndicator?: boolean;
}

export function ExternalLoginButtons({
  mounted,
  loading,
  setLoading,
  redirectTo,
  lastUsedIndicator = true,
}: ExternalLoginButtonsProps) {
  async function handleLogin(provider: string) {
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: redirectTo,
    });
    setLoading(false);

    if (error) {
      if (error.code !== 'AUTH_CANCELLED') {
        toast.error(`${provider} sign-in failed.`, { description: error.message || 'Please try again.' });
      }
    }
  }

  return (
    <>
      {providers.map(({ id, label, icon: Icon, disabled }) => (
        <Button
          key={id}
          variant='outline'
          type='button'
          disabled={disabled || loading}
          onClick={() => handleLogin(id)}
          className='relative'
        >
          {loading ? <Spinner /> : <Icon />}
          <span>Continue with {label}</span>
          {lastUsedIndicator && <LastUsedIndicator id={id} mounted={mounted} />}
        </Button>
      ))}
    </>
  );
}

interface SignInWithPasskeyButtonProps extends ExternalLoginButtonsProps {
  /**
   * Whether to attempt preloading passkey authentication on mount for conditional UI rendering. This is optional and can be set to false to skip the preload attempt.
   * Note: Preloading passkey authentication involves a silent check for available passkeys and may trigger browser prompts in some cases. Use with caution and test across browsers.
   */
  preloadPasskeys?: boolean;
}

export function SignInWithPasskeyButton({
  mounted,
  loading,
  setLoading,
  redirectTo,
  preloadPasskeys,
  lastUsedIndicator = true,
}: SignInWithPasskeyButtonProps) {
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    const { error } = await authClient.signIn.passkey({
      // no autofill for manual trigger
      autoFill: false,
    });
    setLoading(false);

    if (error) {
      const cancellationCodes = ['AUTH_CANCELLED'];
      if ('code' in error && cancellationCodes.includes(error.code)) return;
      toast.error('Failed to add passkey.', { description: error.message?.toString() || 'Unknown error' });
      return;
    }

    // Redirect to specified redirect URL after successful login
    router.push(redirectTo);
  }

  // Preload passkey authentication for conditional UI
  React.useEffect(() => {
    if (!preloadPasskeys) return;
    if (!mounted) return;

    // check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      return;
    }

    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !PublicKeyCredential.isConditionalMediationAvailable()
    ) {
      return;
    }

    const abortController = new AbortController();
    void authClient.signIn
      .passkey({
        autoFill: true,
        fetchOptions: {
          signal: abortController.signal,
          onSuccess() {
            window.location.href = redirectTo;
          },
          onError(context) {
            console.error('❌ [PASSKEY] Autofill sign-in error:', context.error);
          },
        },
      })
      .catch((error) => {
        // Silent catch for autofill errors (user might cancel or no passkey available)
        console.log('🔍 [DEBUG] Autofill passkey silent error:', error);
      });
    return () => abortController.abort();
  }, [preloadPasskeys, mounted, redirectTo]);

  return (
    <Button variant='outline' type='button' disabled={loading} onClick={handleLogin} className='relative'>
      {loading ? <Spinner /> : <UserKeyIcon />}
      <span>Continue with Passkey</span>
      {lastUsedIndicator && <LastUsedIndicator id='passkey' mounted={mounted} />}
    </Button>
  );
}

export function LastUsedIndicator({ id, mounted }: { id: string; mounted: boolean }) {
  if (!mounted) return null;
  if (!authClient.isLastUsedLoginMethod(id)) return null;
  return (
    <span className='pointer-events-none absolute -right-3 ml-auto rounded-md bg-blue-200 px-2 py-1 text-[0.5rem] font-medium text-blue-900 dark:bg-blue-600 dark:text-blue-100'>
      Last
    </span>
  );
}
