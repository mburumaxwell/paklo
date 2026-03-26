import { isSameDay, isValid, isWithinInterval, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export function isValidDateValue(value: Date | null | undefined): value is Date {
  return isValid(value);
}

/** Compares two complete date ranges by calendar day. */
export function isSameDateRange(left: DateRange | null | undefined, right: DateRange | null | undefined) {
  if (!left?.from || !left?.to || !right?.from || !right?.to) return false;

  return isSameDay(left.from, right.from) && isSameDay(left.to, right.to);
}

/** Keeps time bounds only when the selected date falls on the same calendar day. */
export function getTimeBoundsForDate(value: Date | null | undefined, minValue?: Date, maxValue?: Date) {
  if (!value) return { minValue: undefined, maxValue: undefined };

  return {
    minValue: minValue && isSameDay(value, minValue) ? minValue : undefined,
    maxValue: maxValue && isSameDay(value, maxValue) ? maxValue : undefined,
  };
}

/** Checks a date range against date-only min/max bounds without caring about time-of-day. */
export function isDateRangeOutsideBounds(range: DateRange, minValue?: Date, maxValue?: Date) {
  if (!range.from) return false;

  const interval =
    minValue || maxValue
      ? {
          start: startOfDay(minValue ?? range.from),
          end: startOfDay(maxValue ?? range.to ?? range.from),
        }
      : null;

  if (!interval) return false;

  const fromDate = startOfDay(range.from);
  const toDate = startOfDay(range.to ?? range.from);

  return !isWithinInterval(fromDate, interval) || !isWithinInterval(toDate, interval);
}
