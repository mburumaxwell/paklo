'use client';

import { endOfDay, startOfDay } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { type TimeRange, getDateTimeRange, timeRangeOptions } from '@/lib/aggregation';
import { isDateRangeOutsideBounds, isSameDateRange } from '@/lib/dates';
import { cn } from '@/lib/utils';

import type { DatePickerProps } from './date-picker';

export interface DateRangePickerProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant' | 'value'>,
    Pick<DatePickerProps, 'captionLayout' | 'startMonth' | 'endMonth'> {
  /** The currently selected date range. */
  value?: DateRange | null;

  /** Called when the user selects a date range. */
  onValueChange?: (value: DateRange | null) => void;

  /** Minimum selectable date. Dates before this will be disabled. */
  minValue?: Date;

  /** Maximum selectable date. Dates after this will be disabled. */
  maxValue?: Date;

  /** Number of months to display in the calendar popover. */
  numberOfMonths?: number;

  /** Quick range presets shown in the popover. Defaults to the built-in date-only aggregation ranges. */
  presets?: Exclude<TimeRange, '1h' | '4h' | '6h' | '24h'>[];
}

export function DateRangePicker({
  className,
  onValueChange,
  value,
  minValue,
  maxValue,
  numberOfMonths = 2,
  presets = ['7d', '30d', '90d', '12M'],
  captionLayout = 'dropdown',
  startMonth,
  endMonth,
  disabled,
  ...props
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const presetOptions = presets
    .map((presetValue) => timeRangeOptions.find((option) => option.value === presetValue))
    .filter((presetOption): presetOption is (typeof timeRangeOptions)[number] => !!presetOption);

  function formatDateRangeLabel(value: DateRange | null | undefined) {
    if (!value?.from) return 'Select date range';
    if (!value.to) return `${value.from.toLocaleDateString()} -`;
    return `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button variant='outline' className={cn('justify-between', className)} disabled={disabled} {...props}>
            {formatDateRangeLabel(value)}
            <ChevronDownIcon />
          </Button>
        }
      />
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex'>
          <Calendar
            mode='range'
            defaultMonth={value?.from}
            selected={value ?? undefined}
            numberOfMonths={numberOfMonths}
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            disabled={[
              // disable dates outside of the min/max range, if provided
              ...(minValue ? [{ before: minValue }] : []),
              ...(maxValue ? [{ after: maxValue }] : []),
            ]}
            onSelect={(range) => {
              if (!range?.from) {
                onValueChange?.(null);
                return;
              }

              if (!value?.from || value?.to) {
                onValueChange?.({ from: range.from, to: undefined });
                return;
              }

              onValueChange?.(range);

              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
          />
          {presetOptions.length > 0 && (
            <>
              <Separator orientation='vertical' />
              <div className='flex w-44 flex-col gap-2 p-3'>
                {presetOptions.map((option) => {
                  const range = getDateTimeRange(option.value);
                  // for now, we are supporting only date ranges so we remove the time from the range
                  const dateRange: DateRange = { from: startOfDay(range.start), to: endOfDay(range.end) };

                  return (
                    <Button
                      key={option.value}
                      variant={isSameDateRange(value, dateRange) ? 'secondary' : 'ghost'}
                      size='sm'
                      className='justify-start'
                      disabled={disabled || isDateRangeOutsideBounds(dateRange, minValue, maxValue)}
                      onClick={() => {
                        onValueChange?.(dateRange);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
