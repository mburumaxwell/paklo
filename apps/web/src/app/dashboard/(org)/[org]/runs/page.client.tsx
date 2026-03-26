'use client';

import { Funnel } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { DataTableToolbar, type DataTableToolbarOptions, makeToolbarOptionsFacet } from '@/components/data-table';
import { EcosystemIcon, UpdateJobStatusBadge, UpdateJobTriggerIcon } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TimeRangeCodec, timeRangeOptions } from '@/lib/aggregation';
import {
  DependabotPackageManagerCodec,
  UpdateJobStatusCodec,
  UpdateJobTriggerCodec,
  packageManagerOptions,
  updateJobStatusOptions,
  updateJobTriggerOptions,
} from '@/lib/enums';
import { useEnumArrayQueryFilterState, useEnumQueryFilterState, useTextQueryState } from '@/lib/nuqs';
import type { Organization, Project, UpdateJob } from '@/lib/prisma';
import { formatDuration } from '@/lib/utils';

type SimpleOrganization = Pick<Organization, 'id' | 'slug'>;
type SlimProject = Pick<Project, 'id' | 'name'>;
type SlimUpdateJob = Pick<
  UpdateJob,
  | 'id'
  | 'createdAt'
  | 'projectId'
  | 'packageManager'
  | 'ecosystem'
  | 'trigger'
  | 'status'
  | 'repositorySlug'
  | 'duration'
>;
export default function RunsView({
  organization,
  projects,
  jobs,
}: {
  organization: SimpleOrganization;
  projects: SlimProject[];
  jobs: SlimUpdateJob[];
}) {
  const [timeRange, setTimeRange] = useEnumQueryFilterState('timeRange', TimeRangeCodec);
  const [project, setProject] = useTextQueryState('project');
  const [status, setStatus] = useEnumArrayQueryFilterState('status', UpdateJobStatusCodec);
  const [trigger, setTrigger] = useEnumArrayQueryFilterState('trigger', UpdateJobTriggerCodec);
  const [packageManager, setPackageManager] = useEnumArrayQueryFilterState(
    'packageManager',
    DependabotPackageManagerCodec,
  );
  const router = useRouter();
  const projectOptions = projects.map((project) => ({ label: project.name, value: project.id }));
  const toolbar: DataTableToolbarOptions = {
    filters: {
      facets: [
        makeToolbarOptionsFacet({
          column: 'timeRange',
          title: 'Time Range',
          options: timeRangeOptions,
          value: timeRange,
          onChange: setTimeRange,
        }),
        makeToolbarOptionsFacet({
          column: 'project',
          title: 'Project',
          options: projectOptions,
          value: project,
          onChange: setProject,
        }),
        makeToolbarOptionsFacet({
          multiple: true,
          column: 'status',
          title: 'Status',
          options: updateJobStatusOptions,
          value: status,
          onChange: setStatus,
        }),
        makeToolbarOptionsFacet({
          multiple: true,
          column: 'trigger',
          title: 'Trigger',
          options: updateJobTriggerOptions,
          value: trigger,
          onChange: setTrigger,
        }),
        makeToolbarOptionsFacet({
          multiple: true,
          column: 'packageManager',
          title: 'Package Manager',
          options: packageManagerOptions,
          value: packageManager,
          onChange: setPackageManager,
        }),
      ],
    },
  };

  return (
    <>
      {/* Filters */}
      <DataTableToolbar {...toolbar} />

      {/* Data Table */}
      <div className='rounded-md border'>
        <Table className='text-sm'>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='py-12 text-center'>
                  <div className='space-y-2'>
                    <Funnel className='mx-auto size-8 text-muted-foreground' />
                    <p className='text-muted-foreground'>No jobs found matching your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className='cursor-pointer hover:bg-accent/50'
                  onClick={() => router.push(`/dashboard/${organization.slug}/runs/${job.id}`)}
                >
                  <TableCell className='text-medium'>
                    <div className='flex items-center gap-2'>
                      <EcosystemIcon ecosystem={job.ecosystem} className='size-5' />
                      <span className='text-wrap wrap-break-word'>{job.repositorySlug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UpdateJobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <UpdateJobTriggerIcon trigger={job.trigger} className='size-4' />
                      {(job.createdAt && <TimeAgo value={job.createdAt} />) || '—'}
                    </div>
                  </TableCell>
                  <TableCell>{(job.duration && formatDuration(job.duration)) || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
