'use client';

import { LogOut, MoreHorizontal, Shield, UserCheck, UserCog, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import {
  type ColumnDef,
  DataTable,
  DataTableColumnHeader,
  type DataTableToolbarOptions,
  type Row,
  makeToolbarOptionsFacet,
} from '@/components/data-table';
import { TimeAgo } from '@/components/time-ago';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { type UserRole, UserRoleCodec, UserStatusCodec, userRoleOptions, userStatusOptions } from '@/lib/enums';
import { useEnumQueryFilterState, useOffsetQueryState, useTextQueryState } from '@/lib/nuqs';
import type { PaginatedData } from '@/lib/pagination';
import type { User } from '@/lib/prisma';

type SimpleUser = User & { _count: { sessions: number } };

type PendingAction = 'ban' | 'unban' | 'set-role-user' | 'set-role-admin' | 'revoke-sessions' | 'impersonate' | null;

function DataTableRowActions({ row }: { row: Row<SimpleUser> }) {
  const [busy, setBusy] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const router = useRouter();
  const session = authClient.useSession();
  const user = row.original as SimpleUser;

  // Don't show actions for the current user to prevent self-lockout
  if (session.data?.user?.id === user.id) return null;

  async function handleBan() {
    setBusy(true);
    const { error } = await authClient.admin.banUser({ userId: user.id, banReason: 'Banned by admin' });
    setBusy(false);
    setPendingAction(null);

    if (error) {
      toast.error('Failed to ban user', { description: error.message });
      return;
    }

    router.refresh();
  }

  async function handleUnban() {
    setBusy(true);
    const { error } = await authClient.admin.unbanUser({ userId: user.id });
    setBusy(false);
    setPendingAction(null);

    if (error) {
      toast.error('Failed to unban user', { description: error.message });
      return;
    }

    router.refresh();
  }

  async function handleSetRole(role: UserRole) {
    setBusy(true);
    const { error } = await authClient.admin.setRole({ userId: user.id, role });
    setBusy(false);
    setPendingAction(null);

    if (error) {
      toast.error('Failed to set user role', { description: error.message });
      return;
    }

    router.refresh();
  }

  async function handleRevokeSessions() {
    setBusy(true);
    const { data, error: listError } = await authClient.admin.listUserSessions({ userId: user.id });
    if (listError || !data) {
      setBusy(false);
      setPendingAction(null);
      toast.error('Failed to list user sessions', { description: listError?.message });
      return;
    }

    // Revoke all sessions
    await Promise.all(
      data.sessions.map((session) => authClient.admin.revokeUserSession({ sessionToken: session.token })),
    );
    setBusy(false);
    setPendingAction(null);

    router.refresh();
  }

  async function handleImpersonate() {
    setBusy(true);
    const { error } = await authClient.admin.impersonateUser({ userId: user.id });
    setBusy(false);
    setPendingAction(null);

    if (error) {
      toast.error('Failed to impersonate user', { description: error.message });
      return;
    }

    // Impersonation changes the active session, so refresh the shared dashboard layout
    // after navigation to ensure server-rendered role-based UI updates immediately.
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant='ghost' size='icon-xs' disabled={busy} />}>
          <MoreHorizontal />
          <span className='sr-only'>Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Shield className='mr-2' />
                Set Role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setPendingAction('set-role-user')}>User</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPendingAction('set-role-admin')} disabled={user.role === 'admin'}>
                  Admin
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {user.banned ? (
              <DropdownMenuItem onClick={() => setPendingAction('unban')}>
                <UserCheck className='mr-2' />
                Unban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setPendingAction('ban')}>
                <UserX className='mr-2' />
                Ban User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setPendingAction('revoke-sessions')} disabled={user._count.sessions === 0}>
              <LogOut className='mr-2' />
              Revoke Sessions ({user._count.sessions})
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPendingAction('impersonate')}>
            <UserCog className='mr-2' />
            Impersonate User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (busy) return;
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'ban' && 'Ban user?'}
              {pendingAction === 'unban' && 'Unban user?'}
              {pendingAction === 'set-role-user' && 'Set role to User?'}
              {pendingAction === 'set-role-admin' && 'Set role to Admin?'}
              {pendingAction === 'revoke-sessions' && 'Revoke all sessions?'}
              {pendingAction === 'impersonate' && 'Impersonate user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'ban' &&
                `${user.name} will be immediately logged out and unable to sign in until unbanned.`}
              {pendingAction === 'unban' && `${user.name} will be able to sign in again.`}
              {pendingAction === 'set-role-user' &&
                `${user.name} will have standard access. They will not be able to manage customer rates or user accounts.`}
              {pendingAction === 'set-role-admin' &&
                `${user.name} will have full administrative access, including customer rates and user management.`}
              {pendingAction === 'revoke-sessions' &&
                `This will log out ${user.name} from all devices (${user._count.sessions} active session${user._count.sessions === 1 ? '' : 's'}). They can sign in again afterwards.`}
              {pendingAction === 'impersonate' &&
                `You will be signed in as ${user.name}. Use this carefully for debugging or support purposes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button
              variant={pendingAction === 'ban' ? 'destructive' : 'default'}
              onClick={() => {
                if (pendingAction === 'ban') handleBan();
                if (pendingAction === 'unban') handleUnban();
                if (pendingAction === 'set-role-user') handleSetRole('user');
                if (pendingAction === 'set-role-admin') handleSetRole('admin');
                if (pendingAction === 'revoke-sessions') handleRevokeSessions();
                if (pendingAction === 'impersonate') handleImpersonate();
              }}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                <>
                  {pendingAction === 'ban' && 'Ban User'}
                  {pendingAction === 'unban' && 'Unban User'}
                  {pendingAction === 'set-role-user' && 'Set to User'}
                  {pendingAction === 'set-role-admin' && 'Set to Admin'}
                  {pendingAction === 'revoke-sessions' && 'Revoke Sessions'}
                  {pendingAction === 'impersonate' && 'Impersonate'}
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const columns: ColumnDef<SimpleUser>[] = [
  {
    accessorKey: 'name',
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
    cell: ({ row }) => {
      return (
        <div className='max-w-48 md:max-w-64 lg:max-w-80'>
          <span className='block truncate font-medium'>{row.getValue('name')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return (
        <div className='max-w-40 md:max-w-56 lg:max-w-72'>
          <span className='block truncate'>{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Role' />,
    cell: ({ row }) => {
      const value = row.getValue('role') as string | null;
      if (!value) return <span className='text-muted-foreground'>—</span>;

      const option = userRoleOptions.find((r) => r.value === value);
      return (
        <div className='max-w-24'>
          <Badge variant='secondary'>{option?.label ?? value}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'banned',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const banned = row.getValue('banned');
      return (
        <div className='max-w-24'>
          {banned ? (
            <Badge variant='destructive'>Banned</Badge>
          ) : (
            <Badge variant='outline' className='text-green-600'>
              Active
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'sessions',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Sessions' />,
    cell: ({ row }) => {
      return (
        <div className='max-w-20'>
          <span>{row.original._count.sessions}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
    cell: ({ row }) => {
      return (
        <div className='max-w-32'>
          <TimeAgo value={row.getValue('createdAt')} />
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function UsersPageView({
  data: { items: data, hasMore },
  ...props
}: Omit<
  React.ComponentProps<typeof DataTable<SimpleUser>>,
  'columns' | 'toolbar' | 'data' | 'hasMore' | 'onMoreDataNeeded'
> & {
  data: PaginatedData<SimpleUser>;
}) {
  const [q, setQ] = useTextQueryState();
  const [role, setRole] = useEnumQueryFilterState('role', UserRoleCodec);
  const [status, setStatus] = useEnumQueryFilterState('status', UserStatusCodec);
  const [, setOffset] = useOffsetQueryState();

  const toolbar: DataTableToolbarOptions = {
    filters: {
      text: { placeholder: 'Search users ...', value: q, onChange: setQ },
      facets: [
        makeToolbarOptionsFacet({
          column: 'role',
          title: 'Role',
          options: userRoleOptions,
          value: role,
          onChange: setRole,
        }),
        makeToolbarOptionsFacet({
          column: 'banned',
          title: 'Status',
          options: userStatusOptions,
          value: status,
          onChange: setStatus,
        }),
      ],
    },
  };

  return (
    <DataTable
      columns={columns}
      toolbar={toolbar}
      data={data}
      hasMore={hasMore}
      onMoreDataNeeded={() => setOffset(data[data.length - 1]?.sequenceNumber || null)}
      {...props}
    />
  );
}
