'use client';

import {
  Building2,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Home,
  LogOut,
  MailIcon,
  Monitor,
  MoreHorizontalIcon,
  MoreVertical,
  Pencil,
  Settings,
  Smartphone,
  Trash2,
  UserKeyIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';

import { storeFeedback } from '@/actions/feedback';
import { providers } from '@/components/auth-buttons';
import { Controller, useForm, zodResolver } from '@/components/rhf';
import { TimeAgo } from '@/components/time-ago';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { type Account, type Organization, type Passkey, type Session, authClient } from '@/lib/auth-client';
import { z } from '@/lib/zod';

type SessionUser = Session['user'];

export function ProfileSection({ user: initialUser }: { user: SessionUser }) {
  const [user, setUser] = React.useState(initialUser);
  const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
  });
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: user });

  async function handleSave(data: z.infer<typeof formSchema>) {
    const { data: result, error } = await authClient.updateUser({ name: data.name });

    if (error || !result?.status) {
      toast.error('Failed to update profile.', { description: error?.message });
      return;
    }

    setUser((prev) => ({ ...prev, ...data }));
    form.reset(data); // Reset form with new values to clear isDirty flag
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSave)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor='name'>Name</FieldLabel>
                    <Input {...field} id='name' autoComplete='name' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field orientation='horizontal'>
                <Button type='submit' disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Spinner />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  );
}

interface SecuritySectionProps {
  user: Session['user'];
  passkeys: Passkey[];
  accounts: Account[];
}
export function SecuritySection({ user, passkeys: initialPasskeys, accounts: initialAccounts }: SecuritySectionProps) {
  const [passkeys, setPasskeys] = React.useState(initialPasskeys);
  const [accounts, setAccounts] = React.useState(initialAccounts);
  return (
    <>
      <LoginSection
        user={user}
        passkeys={passkeys}
        onPasskeysChanged={setPasskeys}
        accounts={accounts}
        onAccountsChanged={setAccounts}
      />
      {/* <TwoFactorSection user={user} passkeys={passkeys} /> */}
    </>
  );
}

interface LoginSectionProps extends SecuritySectionProps {
  onPasskeysChanged: (passkeys: Passkey[]) => void;
  onAccountsChanged: (accounts: Account[]) => void;
}
function LoginSection({ user, passkeys, onPasskeysChanged, accounts, onAccountsChanged }: LoginSectionProps) {
  const [editingPasskey, setEditingPasskey] = React.useState<Passkey | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const pathname = usePathname();

  const editPassKeyFormSchema = z.object({ name: z.string().min(1, 'Passkey name is required') });
  const editPasskeyForm = useForm({ resolver: zodResolver(editPassKeyFormSchema), defaultValues: { name: '' } });

  async function handleAddPasskey() {
    setProcessing(true);
    const { data, error } = await authClient.passkey.addPasskey({
      // Not setting name, as it overrides the default (email) which makes it look awkward
      // in password managers. Instead, we'll let the user edit it afterwards.
    });
    setProcessing(false);
    if (error) {
      // ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY is from @simplewebauthn/browser
      const cancellationCodes = ['AUTH_CANCELLED', 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'];
      if ('code' in error && cancellationCodes.includes(error.code)) return;
      toast.error('Failed to add passkey.', { description: error.message || 'Unknown error' });
      return;
    }

    onPasskeysChanged([...passkeys, data]);
  }

  async function handleDeletePasskey(id: string) {
    setProcessing(true);
    const { error } = await authClient.passkey.deletePasskey({ id });
    setProcessing(false);
    if (error) {
      toast.error('Failed to delete passkey.', { description: error.message });
      return;
    }

    onPasskeysChanged(passkeys.filter((p) => p.id !== id));
  }

  async function handleSavePasskey(data: z.infer<typeof editPassKeyFormSchema>) {
    if (!editingPasskey) return;

    const { error } = await authClient.passkey.updatePasskey({
      id: editingPasskey.id,
      name: data.name,
    });
    setEditingPasskey(null);
    editPasskeyForm.reset();

    if (error) {
      toast.error('Failed to update passkey name.', { description: error.message });
      return;
    }

    onPasskeysChanged(passkeys.map((p) => (p.id === editingPasskey.id ? { ...p, name: data.name } : p)));
  }

  function handleEditPasskey(passkey: Passkey) {
    editPasskeyForm.reset({ name: passkey.name ?? '' });
    setEditingPasskey(passkey);
  }

  async function handleSocialConnect(provider: string) {
    setProcessing(true);
    const { error } = await authClient.linkSocial({ provider, callbackURL: pathname });
    setProcessing(false);
    if (error) {
      toast.error('Failed to connect account.', { description: error.message || 'Unknown error' });
      return;
    }

    // since this works by redirect, the whole page will reload when it comes back, so
    // we don't need to manually update the accounts state here
  }

  async function handleSocialDisconnect({ providerId, accountId }: Account) {
    setProcessing(true);
    const { error } = await authClient.unlinkAccount({ providerId, accountId });
    setProcessing(false);
    if (error) {
      toast.error('Failed to disconnect account.', { description: error.message || 'Unknown error' });
      return;
    }

    onAccountsChanged(accounts.filter((a) => a.id !== accountId));
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sign-in Methods</CardTitle>
          <CardDescription>
            Customize how you access your account. Link your external accounts and set up passkeys for seamless, secure
            authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <>
            {/* Email */}
            <Item size='sm'>
              <ItemMedia variant='image'>
                <MailIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Email</ItemTitle>
                <ItemDescription>{user.email}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button type='button' size='sm' disabled>
                  Change
                </Button>
              </ItemActions>
            </Item>
            <ItemSeparator />

            {/* Passkeys */}
            <Item size='sm'>
              <ItemMedia variant='image'>
                <UserKeyIcon />
              </ItemMedia>
              <Collapsible className='gap-inherit flex flex-1 flex-wrap items-center'>
                <ItemContent>
                  <ItemTitle>Passkeys</ItemTitle>
                  <ItemDescription className='flex items-center gap-1.5'>
                    {passkeys.length} passkeys registered
                    {passkeys.length > 0 && (
                      <CollapsibleTrigger
                        render={<Button variant='ghost' size='icon-xs' disabled={processing} />}
                        aria-label='Toggle passkeys'
                        disabled={processing}
                      >
                        <ChevronsUpDown className='size-4' />
                        <span className='sr-only'>Toggle passkeys</span>
                      </CollapsibleTrigger>
                    )}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button type='button' size='sm' onClick={handleAddPasskey} disabled={processing}>
                    {processing && <Spinner />}
                    {!processing && 'Add'}
                  </Button>
                </ItemActions>

                {passkeys.length > 0 && (
                  <CollapsibleContent className='mt-2 basis-full divide-y divide-border/60 border-t border-border/60 pt-2'>
                    {passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className='flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0'
                      >
                        <p className='min-w-0 truncate text-sm font-medium'>{passkey.name || 'Unnamed passkey'}</p>

                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            type='button'
                            onClick={() => handleEditPasskey(passkey)}
                            disabled={processing}
                          >
                            <Pencil />
                            <span className='sr-only'>Edit passkey</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={<Button variant='ghost' size='icon-xs' type='button' disabled={processing} />}
                            >
                              <Trash2 className='text-destructive' />
                              <span className='sr-only'>Delete passkey</span>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete passkey</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove {passkey.name || 'this passkey'} from your account? You will no longer be able
                                  to sign in with it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
                                  onClick={() => handleDeletePasskey(passkey.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Item>
            <ItemSeparator />

            {providers.map(({ icon: Icon, ...provider }, index) => {
              const account = accounts.find((acc) => acc.providerId === provider.id);
              return (
                <React.Fragment key={provider.id}>
                  <Item size='sm'>
                    <ItemMedia variant='image'>
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{provider.label}</ItemTitle>
                      <ItemDescription>
                        {account && (
                          <>
                            Connected <TimeAgo value={account.createdAt} />
                          </>
                        )}
                        {!account && `Connect your ${provider.label} account`}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {!account && (
                        <Button
                          size='sm'
                          onClick={() => handleSocialConnect(provider.id)}
                          disabled={processing || provider.disabled}
                        >
                          {processing && <Spinner />}
                          {!processing && 'Connect'}
                        </Button>
                      )}

                      {account && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant='ghost' size='icon' disabled={processing} />}>
                            {processing ? <Spinner /> : <MoreHorizontalIcon />}
                            <span className='sr-only'>{processing ? 'Processing' : 'Actions'}</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-fit'>
                            <DropdownMenuItem
                              render={<a href={provider.manageUrl} target='_blank' rel='noopener noreferrer' />}
                            >
                              Manage on {provider.label}
                              <ExternalLink className='ml-2 size-4' />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSocialDisconnect(account)}
                              className='text-destructive'
                              disabled={processing}
                            >
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </ItemActions>
                  </Item>
                  {index < providers.length - 1 && <ItemSeparator />}
                </React.Fragment>
              );
            })}
          </>
        </CardContent>
      </Card>

      {/* Edit Passkey Dialog */}
      <Dialog
        open={!!editingPasskey}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPasskey(null);
            editPasskeyForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit passkey</DialogTitle>
            <DialogDescription>Update the name of your passkey to help you identify it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editPasskeyForm.handleSubmit(handleSavePasskey)}>
            <div className='py-4'>
              <FieldGroup>
                <Controller
                  name='name'
                  control={editPasskeyForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor='passkey-name'>Passkey name</FieldLabel>
                      <Input {...field} id='passkey-name' placeholder='e.g., MacBook Pro' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setEditingPasskey(null);
                  editPasskeyForm.reset();
                }}
                disabled={editPasskeyForm.formState.isSubmitting}
                type='button'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={editPasskeyForm.formState.isSubmitting || !editPasskeyForm.formState.isDirty}
              >
                {editPasskeyForm.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SessionsSection({
  activeSessionId,
  sessions: rawSessions,
}: {
  activeSessionId: string;
  sessions: Session['session'][];
}) {
  // sort sessions by updatedAt desc and place the active session at the top
  const sortedSessions = rawSessions.sort((a, b) => {
    if (a.id === activeSessionId) return -1;
    if (b.id === activeSessionId) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  const [sessions, setSessions] = React.useState(sortedSessions);
  const [isModifyingSessions, setIsModifyingSessions] = React.useState(false);

  async function handleRevokeSession(token: string) {
    setIsModifyingSessions(true);
    const { data, error } = await authClient.revokeSession({ token });
    setIsModifyingSessions(false);

    if (error || !data.status) {
      toast.error('Failed to revoke session.', {
        description: error?.message || 'Unknown error',
      });
      return;
    }

    setSessions((prev) => prev.filter((s) => s.token !== token));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Manage devices where you are currently signed in</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className='gap-3'>
          {sessions.map((session) => {
            const isCurrent = session.id === activeSessionId;
            function getDevice(input: string): [mobile: boolean, name: string] {
              const parser = UAParser(input);
              return [
                parser.device.type === 'mobile',
                parser.os.name && parser.browser.name
                  ? `${parser.os.name}, ${parser.browser.name}`
                  : parser.os.name || parser.browser.name || input || 'Unknown Device',
              ];
            }
            const [isMobile, deviceName] = getDevice(session.userAgent || '');
            const Icon = isMobile ? Smartphone : Monitor;

            return (
              <Item key={session.id} variant='outline'>
                <ItemMedia variant='image'>
                  <Icon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {deviceName}
                    {isCurrent && (
                      <Badge variant='secondary' className='ml-2 gap-1 text-xs'>
                        <Check />
                        Current
                      </Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {session.ipAddress} • <TimeAgo value={session.updatedAt} />
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant='ghost' size='sm' disabled={isModifyingSessions} />}>
                        Revoke
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will sign out the device from your account. You will need to sign in again on that
                            device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeSession(session.token)}>
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

export function OrganizationsSection({ organizations: initialOrganizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [organizations, setOrganizations] = React.useState(initialOrganizations);
  const [orgToLeave, setOrgToLeave] = React.useState<Organization | null>(null);
  const [leaveFeedback, setLeaveFeedback] = React.useState('');
  const [isLeavingOrg, setIsLeavingOrg] = React.useState(false);

  async function handleLeaveOrg() {
    if (!orgToLeave) return;

    setIsLeavingOrg(true);

    // collect feedback if provided
    if (leaveFeedback) {
      await storeFeedback({
        type: 'organization.leave',
        message: leaveFeedback,
        metadata: { organizationId: orgToLeave.id },
      });
    }

    const { error } = await authClient.organization.leave({ organizationId: orgToLeave.id });
    setIsLeavingOrg(false);
    setOrgToLeave(null);
    setLeaveFeedback('');
    if (error) {
      toast.error('Failed to leave organization', { description: error.message });
      return;
    }

    // remove organization from the list
    setOrganizations((prev) => prev.filter((org) => org.id !== orgToLeave.id));

    // if there are no organizations left, redirect to dashboard root
    if (organizations.length === 0) {
      router.push('/dashboard');
      return;
    }

    setOrganizations((prev) => prev.filter((org) => org.id !== orgToLeave.id));
  }

  return (
    <>
      <Card>
        {organizations.length === 0 ? null : (
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Organizations you are a member of</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {organizations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>No organizations</EmptyTitle>
                <EmptyDescription>
                  You are not a member of any organizations yet.
                  <br />
                  Once you join or create an organization, it will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className='gap-3'>
              {organizations.map((org) => (
                <Item key={org.id} variant='outline'>
                  <ItemMedia variant='icon' className='size-10'>
                    <Building2 className='size-5' />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{org.name}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant='ghost' size='icon' />}>
                        <MoreVertical className='size-4' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${org.slug}`)}>
                          <Home className='mr-2 size-4' />
                          Home
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${org.slug}/settings`)}>
                          <Settings className='mr-2 size-4' />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={() => setOrgToLeave(org)}
                        >
                          <LogOut className='mr-2 size-4' />
                          Leave
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!orgToLeave}
        onOpenChange={(open) => {
          if (!open) {
            setOrgToLeave(null);
            setLeaveFeedback('');
          }
        }}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {orgToLeave?.name}?</AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                Leaving will result in the loss of your access to all resources and data associated with this
                organization.
              </p>
              <div className='space-y-2 pt-2'>
                <Label htmlFor='leave-feedback' className='text-sm font-normal text-foreground'>
                  Help us improve (optional)
                </Label>
                <Textarea
                  id='leave-feedback'
                  value={leaveFeedback}
                  onChange={(e) => setLeaveFeedback(e.target.value)}
                  placeholder='Why are you leaving? Your feedback helps us improve...'
                  className='min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={isLeavingOrg}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingOrg}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveOrg} disabled={isLeavingOrg} className='bg-destructive'>
              {isLeavingOrg ? (
                <>
                  <Spinner className='mr-2' />
                  Leaving...
                </>
              ) : (
                'Leave'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DangerSection({ userId, hasOrganizations }: { userId: string; hasOrganizations: boolean }) {
  const [deleteFeedback, setDeleteFeedback] = React.useState('');
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);

    // collect feedback if provided
    if (deleteFeedback) {
      await storeFeedback({
        // use the user ID to avoid duplicates because delete requires email confirmation (i.e. 2 step)
        deduplicationId: `delete_${userId}`,
        type: 'user.delete',
        message: deleteFeedback,
        metadata: { userId },
      });
    }

    // this will trigger the delete account flow (sends a verification email, with a link)
    const { data, error } = await authClient.deleteUser({ callbackURL: '/login' });
    setIsDeletingAccount(false);
    setShowDeleteDialog(false);
    setDeleteFeedback('');
    if (error || !data?.success) {
      toast.error('Failed to initiate account deletion.', {
        description: error?.message || 'Unknown error',
      });
      return;
    }

    // inform the user to check their email
    toast.success('Account deletion requested.', {
      description: 'Please check your email to confirm account deletion.',
    });
  }

  return (
    <>
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 items-start justify-between py-4 md:grid-cols-3'>
            <div className='space-y-1 md:col-span-2'>
              <p className='font-medium'>Delete account</p>
              <p className='text-sm text-muted-foreground'>Permanently delete your account and all associated data</p>
              {hasOrganizations && (
                <p className='mt-1 text-xs text-destructive'>
                  You need to leave or delete all organizations before closing your account.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteFeedback('');
          }
        }}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers.
              </p>
              <div className='space-y-2 pt-2'>
                <Label htmlFor='delete-feedback' className='text-sm font-normal text-foreground'>
                  Help us improve (optional)
                </Label>
                <textarea
                  id='delete-feedback'
                  value={deleteFeedback}
                  onChange={(e) => setDeleteFeedback(e.target.value)}
                  placeholder='Why are you leaving? Your feedback helps us improve...'
                  className='min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={isDeletingAccount}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <Button onClick={handleDeleteAccount} variant='destructive' disabled={isDeletingAccount}>
              {isDeletingAccount ? (
                <>
                  <Spinner className='mr-2' />
                  Deleting...
                </>
              ) : (
                'Delete account'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
