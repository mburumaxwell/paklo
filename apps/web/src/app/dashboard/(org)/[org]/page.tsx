import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  type TimeRange,
  TimeRangeCodec,
  getDateFromTimeRange,
  getStatsGranularity,
  granularityToMilliseconds,
} from '@/lib/aggregation';
import { createLoader, enumFilter } from '@/lib/nuqs';
import type { Period } from '@/lib/period';
import { prisma } from '@/lib/prisma';

import { ChartsSection, StatsSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Activity',
    description: 'View your activity',
    openGraph: { url: `/dashboard/${organizationSlug}` },
  };
}

export default async function ActivityPage(props: PageProps<'/dashboard/[org]'>) {
  const { org } = await props.params;

  const filterSearchParams = {
    timeRange: enumFilter(TimeRangeCodec).withDefault('7d'),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { timeRange } = searchParamsLoader(await props.searchParams);

  const organization = await getOrganization(org);
  if (!organization) return notFound();

  // fetch data in parallel
  const [statsData, chartData] = await Promise.all([
    fetchStats(organization.id, timeRange),
    fetchChartData(organization.id, timeRange),
  ]);

  return (
    <div className='space-y-6 p-6'>
      <StatsSection data={statsData} />
      <ChartsSection data={chartData} />
    </div>
  );
}

async function fetchStats(organizationId: string, timeRange: TimeRange) {
  async function getData(organizationId: string, { start, end }: Period) {
    const where = { organizationId, createdAt: { gte: start, lt: end } };
    const [count, succeeded, durationAgg, running] = await Promise.all([
      prisma.updateJob.count({ where }),
      prisma.updateJob.count({ where: { ...where, status: 'succeeded' } }),
      prisma.updateJob.aggregate({
        where: { ...where, duration: { not: null } },
        _sum: { duration: true },
      }),
      prisma.updateJob.count({ where: { ...where, status: { in: ['running', 'scheduled'] } } }),
    ]);

    const duration = (durationAgg._sum.duration ?? 0) / 60_000; // convert from ms to minutes

    return {
      count,
      succeeded,
      successRate: count === 0 ? 0 : (succeeded / count) * 100,
      duration,
      running,
    };
  }

  // compute the date ranges
  const end = new Date();
  const primary: Period = getDateFromTimeRange(timeRange, { end });
  const compare: Period = getDateFromTimeRange(timeRange, { end: primary.start });

  // fetch stats for both ranges in parallel
  const [current, previous] = await Promise.all([getData(organizationId, primary), getData(organizationId, compare)]);
  return { current, previous };
}

async function fetchChartData(organizationId: string, timeRange: TimeRange) {
  const floorToBucket = (d: Date, bucketMs: number) => new Date(Math.floor(d.getTime() / bucketMs) * bucketMs);
  const bucketStart = (d: Date, bucketMs: number) => new Date(Math.floor(d.getTime() / bucketMs) * bucketMs);

  type Row = { createdAt: Date; duration: number | null };

  function bucketizeMinutes(rows: Row[], range: Period, bucketMs: number): Map<string, number> {
    const map = new Map<string, number>();

    // initialise all buckets to 0 so the chart is stable
    for (let t = range.start.getTime(); t < range.end.getTime(); t += bucketMs) {
      map.set(new Date(t).toISOString(), 0);
    }

    for (const r of rows) {
      if (r.duration == null) continue;
      const b = bucketStart(r.createdAt, bucketMs).toISOString();
      if (!map.has(b)) continue; // can happen if row is on boundary and you change semantics
      map.set(b, (map.get(b) ?? 0) + r.duration / 60_000);
    }

    return map;
  }

  function shiftBucketKeys(bucketMap: Map<string, number>, offsetMs: number): Map<string, number> {
    const shifted = new Map<string, number>();
    for (const [iso, v] of bucketMap.entries()) {
      const shiftedIso = new Date(new Date(iso).getTime() + offsetMs).toISOString();
      shifted.set(shiftedIso, v);
    }
    return shifted;
  }

  async function getData(organizationId: string, { start, end }: Period) {
    return await prisma.updateJob.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lt: end },
        duration: { not: null },
      },
      select: { createdAt: true, duration: true },
    });
  }

  const granularity = getStatsGranularity(timeRange);
  const bucketMs = granularityToMilliseconds(granularity);

  // freeze and align "now" once for consistent buckets
  const end = floorToBucket(new Date(), bucketMs);
  const primary: Period = getDateFromTimeRange(timeRange, { end });
  const compare: Period = getDateFromTimeRange(timeRange, { end: primary.start });

  const [currentRows, compareRows] = await Promise.all([
    getData(organizationId, primary),
    getData(organizationId, compare),
  ]);

  const currentBuckets = bucketizeMinutes(currentRows, primary, bucketMs);
  const compareBucketsRaw = bucketizeMinutes(compareRows, compare, bucketMs);

  // shift compare series so it overlays the primary x-axis
  const offsetMs = primary.start.getTime() - compare.start.getTime();
  const compareBuckets = shiftBucketKeys(compareBucketsRaw, offsetMs);

  // merge into recharts-friendly data
  const points: { timestamp: string; current: number; previous: number }[] = [];
  for (let t = primary.start.getTime(); t < primary.end.getTime(); t += bucketMs) {
    const timestamp = new Date(t).toISOString();
    points.push({
      timestamp,
      current: currentBuckets.get(timestamp) ?? 0,
      previous: compareBuckets.get(timestamp) ?? 0,
    });
  }

  return {
    granularity,
    primary: { start: primary.start.toISOString(), end: primary.end.toISOString() },
    compare: { start: compare.start.toISOString(), end: compare.end.toISOString() },
    points,
  };
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({ where: { slug }, select: { id: true } });
}
