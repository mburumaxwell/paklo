'use client';

import { AlertCircle, Calendar, Download, GitBranch, MapPinHouse, PlayCircle, Timer } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import React from 'react';
import useSWR from 'swr';

import { EcosystemIcon, type Icon, UpdateJobStatusIcon, UpdateJobTriggerIcon } from '@/components/icons';
import { TimeAgo } from '@/components/time-ago';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import type { Organization, UpdateJob } from '@/lib/prisma';
import { type RegionCode, getRegionInfo } from '@/lib/regions';
import { formatDuration } from '@/lib/utils';

type SlimOrganization = Pick<Organization, 'id' | 'slug'>;
type SlimUpdateJob = Pick<
  UpdateJob,
  | 'id'
  | 'repositorySlug'
  | 'ecosystem'
  | 'trigger'
  | 'status'
  | 'region'
  | 'createdAt'
  | 'startedAt'
  | 'finishedAt'
  | 'duration'
>;

function RegionLabel({ code }: { code: RegionCode }) {
  return <span title={code}>{getRegionInfo(code)?.label ?? code}</span>;
}

export function InfoSection({ job }: { job: SlimUpdateJob }) {
  const parts: {
    label: string;
    value: React.ReactNode | string;
    icon: Icon;
  }[] = [
    { label: 'Repository', value: job.repositorySlug, icon: GitBranch },
    { label: 'Region', value: <RegionLabel code={job.region} />, icon: MapPinHouse },
    { label: 'Ecosystem', value: job.ecosystem, icon: () => <EcosystemIcon ecosystem={job.ecosystem} /> },
    { label: 'Trigger', value: job.trigger, icon: () => <UpdateJobTriggerIcon trigger={job.trigger} /> },
    { label: 'Status', value: job.status, icon: () => <UpdateJobStatusIcon status={job.status} /> },
    { label: 'Duration', value: job.duration ? formatDuration(job.duration) : '-', icon: Timer },
    { label: 'Created', value: <TimeAgo value={job.createdAt} />, icon: Calendar },
    { label: 'Started', value: job.startedAt ? <TimeAgo value={job.startedAt} /> : '-', icon: PlayCircle },
  ];

  return (
    <ItemGroup className='grid flex-none md:grid-cols-2 lg:grid-cols-3'>
      {parts.map(({ label, value, icon: Icon }) => (
        <React.Fragment key={label}>
          <Item className='gap-2 p-2'>
            <ItemMedia variant='icon'>
              <Icon className='size-4' />
            </ItemMedia>
            <ItemContent className='gap-0.5'>
              <ItemTitle>{label}</ItemTitle>
              <p className='text-sm leading-normal font-normal text-balance text-muted-foreground'>{value}</p>
            </ItemContent>
          </Item>
        </React.Fragment>
      ))}
    </ItemGroup>
  );
}

export function LogsSection({ organization, job }: { organization: SlimOrganization; job: SlimUpdateJob }) {
  const url = `/dashboard/${organization.slug}/runs/${job.id}/logs` as Route;
  const { data, error, isLoading } = useSWR(
    url,
    async (logsUrl: string) => {
      const response = await fetch(logsUrl);
      if (response.status === 404) {
        throw new Error('Logs not found');
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      return response.text();
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const logs = data ?? '';
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <Item variant='outline'>
      <ItemContent>
        <ItemTitle>Logs</ItemTitle>
        <ItemDescription>Logs collected from the update job</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant='secondary' asChild disabled={isLoading || !!errorMessage || logs.length === 0}>
          <Link href={url} className='flex' target='_blank' rel='noopener noreferrer'>
            <Download className='mr-2 size-4' />
            Download Logs
          </Link>
        </Button>
      </ItemActions>
      {isLoading && (
        <div className='flex h-125 w-full items-center justify-center rounded-md border bg-muted/50'>
          <div className='flex flex-col items-center gap-3'>
            <Spinner className='size-8 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>Loading logs...</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className='flex h-125 w-full items-center justify-center rounded-md border bg-muted/50'>
          <div className='flex flex-col items-center gap-3'>
            <AlertCircle className='size-8 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>{errorMessage}</p>
          </div>
        </div>
      )}
      {!isLoading && !errorMessage && (
        <ScrollArea className='h-125 w-full border bg-muted/50 p-4'>
          <pre className='font-mono text-xs leading-relaxed whitespace-pre-wrap'>{logs}</pre>
        </ScrollArea>
      )}
    </Item>
  );
}
