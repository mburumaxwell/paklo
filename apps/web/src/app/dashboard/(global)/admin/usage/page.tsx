import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { forbidden, unauthorized } from 'next/navigation';

import { TimeRangeCodec, getDateFromTimeRange } from '@/lib/aggregation';
import { auth, userHasPermission } from '@/lib/auth';
import { DependabotPackageManagerCodec } from '@/lib/enums';
import { type Filter, type UsageTelemetry, getMongoCollection } from '@/lib/mongodb';
import { booleanFilter, createLoader, enumArrayFilter, enumFilter } from '@/lib/nuqs';
import { RegionCodeCodec } from '@/lib/regions';

import { type SlimTelemetry, TelemetryDashboard } from './page.client';

export const metadata: Metadata = {
  title: 'Usage Statistics',
  description: 'View usage statistics',
  openGraph: { url: `/dashboard/admin/usage` },
};

export default async function Page(props: PageProps<'/dashboard/admin/usage'>) {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) return unauthorized();
  if (!(await userHasPermission({ headers, permissions: { usage: ['view'] } }))) return forbidden();

  const filterSearchParams = {
    timeRange: enumFilter(TimeRangeCodec).withDefault('24h'),
    region: enumArrayFilter(RegionCodeCodec),
    packageManager: enumArrayFilter(DependabotPackageManagerCodec),
    success: booleanFilter(),
  };
  const searchParamsLoader = createLoader(filterSearchParams);
  const { timeRange, region, packageManager, success } = searchParamsLoader(await props.searchParams);
  const { start, end } = getDateFromTimeRange(timeRange);

  const collection = await getMongoCollection('usage_telemetry');
  const query: Filter<UsageTelemetry> = {
    started: { $gte: start, $lte: end },
    ...(region.length ? { region: { $in: region } } : {}),
    ...(packageManager.length ? { 'package-manager': { $in: packageManager } } : {}),
    ...(success !== null ? { success } : {}),
  };
  const telemetries = await collection
    .find(query)
    .sort({ started: -1 })
    .project<SlimTelemetry>({
      '_id': 1,
      'region': 1,
      'package-manager': 1,
      'started': 1,
      'success': 1,
      'duration': 1,
    })
    .toArray();

  return (
    <div className='min-h-screen bg-background'>
      <TelemetryDashboard telemetries={telemetries} />
    </div>
  );
}
