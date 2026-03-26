import type { LabelMappingValue, LabelOption } from '@/lib/enums';
import { z } from '@/lib/zod';

// Time Range
export const TimeRangeSchema = z.enum(['1h', '4h', '6h', '12h', '24h', '7d', '30d', '90d', '12M']);
export type TimeRange = z.infer<typeof TimeRangeSchema>;
const timeRangeLabelMap: Record<TimeRange, LabelMappingValue> = {
  '1h': { label: 'Last 1 Hour' },
  '4h': { label: 'Last 4 Hours' },
  '6h': { label: 'Last 6 Hours' },
  '12h': { label: 'Last 12 Hours' },
  '24h': { label: 'Last 24 Hours' },
  '7d': { label: 'Last 7 Days' },
  '30d': { label: 'Last 30 Days' },
  '90d': { label: 'Last 3 Months' },
  '12M': { label: 'Last 12 Months' },
};
export const timeRangeOptions: LabelOption<TimeRange>[] = Object.entries(timeRangeLabelMap).map(([value, props]) => ({
  value: value as TimeRange,
  ...props,
}));
export const TimeRangeCodec = z.enumCodec(TimeRangeSchema);
const TIME_RANGES_MAP: Record<TimeRange, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '12M': 12 * 30 * 24 * 60 * 60 * 1000,
};
export type DateTimeRangePair = { start: Date; end: Date };
export function getDateFromTimeRange(
  value: TimeRange,
  options: { start: Date } | { end: Date } = { end: new Date() },
): DateTimeRangePair {
  const duration = TIME_RANGES_MAP[value];
  if (!duration) throw new Error(`Unsupported time range: ${value}`);

  // if both start and end are specified, throw error
  if ('start' in options && 'end' in options) {
    throw new Error('Cannot specify both start and end dates');
  }

  // if end is provided, calculate start
  if ('end' in options) {
    const { end } = options;
    return { start: new Date(end.getTime() - duration), end };
  }
  const { start } = options;
  return { start, end: new Date(start.getTime() + duration) };
}
export function isHourlyRange(timeRange: TimeRange) {
  return ['1h', '4h', '6h', '12h', '24h'].includes(timeRange);
}
export function getCompareLabels(range: TimeRange) {
  const currentLabel = timeRangeOptions.find((o) => o.value === range)!.label;
  // "Last 7 Days" -> "Previous 7 Days"
  const previousLabel = `Previous ${currentLabel.slice(5)}`;
  return { currentLabel, previousLabel };
}

// Granularity
export const GranularitySchema = z.enum(['5m', '15m', '30m', '1h', '6h', '12h', '1d', '1w', '1M']);
export type Granularity = z.infer<typeof GranularitySchema>;
const granularityLabelMap: Record<Granularity, LabelMappingValue> = {
  '5m': { label: '5 Minutes' },
  '15m': { label: '15 Minutes' },
  '30m': { label: '30 Minutes' },
  '1h': { label: '1 Hour' },
  '6h': { label: '6 Hours' },
  '12h': { label: '12 Hours' },
  '1d': { label: '1 Day' },
  '1w': { label: '1 Week' },
  '1M': { label: '1 Month' },
};
export const granularityOptions: LabelOption<Granularity>[] = Object.entries(granularityLabelMap).map(
  ([value, props]) => ({
    value: value as Granularity,
    ...props,
  }),
);
export const GranularityCodec = z.enumCodec(GranularitySchema);
const GRANULARITIES_MAP: Record<Granularity, number> = {
  '5m': 5 * 60 * 1_000,
  '15m': 15 * 60 * 1_000,
  '30m': 30 * 60 * 1_000,
  '1h': 1 * 60 * 60 * 1_000,
  '6h': 6 * 60 * 60 * 1_000,
  '12h': 12 * 60 * 60 * 1_000,
  '1d': 24 * 60 * 60 * 1_000,
  '1w': 7 * 24 * 60 * 60 * 1_000,
  '1M': 30 * 24 * 60 * 60 * 1_000,
};
export function granularityToMilliseconds(value: Granularity): number {
  const ms = GRANULARITIES_MAP[value];
  if (!ms) throw new Error(`Unsupported granularity: ${value}`);
  return ms;
}
export const statsTimeRangeOptions = timeRangeOptions.filter((o) => ['7d', '30d', '90d'].includes(o.value));
export const defaultStatsTimeRangeOption = statsTimeRangeOptions[0]!;
export function getStatsGranularity(range: TimeRange): Granularity {
  switch (range) {
    case '7d':
      return '1h';
    case '30d':
      return '6h';
    case '90d':
      return '1d';
    default:
      throw new Error('Unsupported time range for granularity');
  }
}
