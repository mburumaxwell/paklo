import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { forbidden, unauthorized } from 'next/navigation';

import { auth, userHasPermission } from '@/lib/auth';
import { UserRoleCodec, UserStatusCodec } from '@/lib/enums';
import { createLoader, enumArrayFilter, offsetFilter, textFilter } from '@/lib/nuqs';
import { getPaginatedData, getTake } from '@/lib/pagination';
import { prisma, processSearchQuery } from '@/lib/prisma';

import { UsersPageView } from './page.client';

export const metadata: Metadata = {
  title: 'Users',
};

export default async function UsersPage(props: PageProps<'/dashboard/admin/users'>) {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) unauthorized();
  if (!(await userHasPermission({ headers, permissions: { user: ['list'] } }))) forbidden();

  const filterSearchParams = {
    q: textFilter(),
    role: enumArrayFilter(UserRoleCodec),
    status: enumArrayFilter(UserStatusCodec),
    offset: offsetFilter(),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { q, role, status, offset } = searchParamsLoader(await props.searchParams);

  // Map status filter to banned field
  const statusFilter = status.length
    ? status.includes('active') && status.includes('banned')
      ? {} // both selected = no filter
      : status.includes('banned')
        ? { banned: true }
        : { banned: { not: true } } // active means not banned (handles null as well)
    : {};

  // Full-text search filter using PostgreSQL with prefix matching
  const textSearch = q ? processSearchQuery(q) : '';
  const textSearchFilter = textSearch
    ? { OR: [{ name: { search: textSearch } }, { email: { search: textSearch } }] }
    : {};

  const take = getTake(100);
  const users = await prisma.user.findMany({
    where: {
      ...textSearchFilter,
      ...(role.length ? { role: { in: role } } : {}),
      ...statusFilter,
    },
    cursor: offset ? { sequenceNumber: offset } : undefined,
    orderBy: { sequenceNumber: 'desc' },
    skip: offset ? 1 : 0, // skip the cursor item
    take: take.db,
    include: { _count: { select: { sessions: true } } },
  });

  const data = getPaginatedData(users, take);
  return (
    <div className='min-h-screen bg-background p-4'>
      <UsersPageView data={data} />
    </div>
  );
}
