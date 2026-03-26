import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { TimeRangeCodec, getDateFromTimeRange } from '@/lib/aggregation';
import { DependabotPackageManagerCodec, UpdateJobStatusCodec, UpdateJobTriggerCodec } from '@/lib/enums';
import { createLoader, enumArrayFilter, enumFilter, textFilter } from '@/lib/nuqs';
import { prisma } from '@/lib/prisma';

import RunsView from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/runs'>): Promise<Metadata> {
  const { org } = await props.params;
  return {
    title: 'Runs',
    description: 'View your runs',
    openGraph: { url: `/dashboard/${org}/runs` },
  };
}

export default async function RunsPage(props: PageProps<'/dashboard/[org]/runs'>) {
  const { org: organizationSlug } = await props.params;

  const filterSearchParams = {
    timeRange: enumFilter(TimeRangeCodec).withDefault('24h'),
    project: textFilter(),
    status: enumArrayFilter(UpdateJobStatusCodec),
    trigger: enumArrayFilter(UpdateJobTriggerCodec),
    packageManager: enumArrayFilter(DependabotPackageManagerCodec),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { timeRange, project, status, trigger, packageManager } = searchParamsLoader(await props.searchParams);
  const { start, end } = getDateFromTimeRange(timeRange);

  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
  });
  if (!organization) return notFound();

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
  });

  const jobs = await prisma.updateJob.findMany({
    where: {
      organizationId: organization.id, // must belong to the active organization
      createdAt: { gte: start, lte: end },
      ...(project.length ? { projectId: project } : {}),
      ...(status.length ? { status: { in: status } } : {}),
      ...(trigger.length ? { trigger: { in: trigger } } : {}),
      ...(packageManager.length ? { packageManager: { in: packageManager } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      projectId: true,
      packageManager: true,
      ecosystem: true,
      status: true,
      trigger: true,
      repositorySlug: true,
      duration: true,
    },
  });

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <div>
        <h1 className='mb-2 text-3xl font-semibold'>Update Jobs</h1>
        <p className='text-muted-foreground'>Monitor and track dependency update jobs across your repositories</p>
      </div>
      <RunsView organization={organization} projects={projects} jobs={jobs} />
    </div>
  );
}
