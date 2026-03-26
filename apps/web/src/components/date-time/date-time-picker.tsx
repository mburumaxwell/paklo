'use client';

import { ButtonGroup } from '@/components/ui/button-group';
import { getTimeBoundsForDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { DatePicker, DatePickerInput, type DatePickerProps } from './date-picker';
import { type TimePickerInputProps, type TimePickerProps } from './time-picker';
import { TimePicker, TimePickerInput } from './time-picker';

export interface DateTimePickerProps
  extends
    Pick<
      TimePickerProps,
      'id' | 'value' | 'onValueChange' | 'minValue' | 'maxValue' | 'minuteStep' | 'format' | 'disabled' | 'className'
    >,
    Pick<DatePickerProps, 'captionLayout' | 'startMonth' | 'endMonth'> {}

export function DateTimePicker({
  id,
  className,
  onValueChange,
  value,
  minValue,
  maxValue,
  minuteStep,
  format,
  captionLayout,
  startMonth,
  endMonth,
  disabled,
}: DateTimePickerProps) {
  const timeBounds = getTimeBoundsForDate(value, minValue, maxValue);

  return (
    <ButtonGroup className={cn('w-full', className)}>
      <DatePicker
        id={id ? `${id}-date` : undefined}
        value={value}
        onValueChange={(nextDate) => onValueChange?.(mergeDateValue(nextDate, value))}
        minValue={minValue}
        maxValue={maxValue}
        captionLayout={captionLayout}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={disabled}
        className='min-w-0 grow basis-2/3'
      />
      <TimePicker
        id={id ? `${id}-time` : undefined}
        value={value}
        onValueChange={(nextTime) => onValueChange?.(mergeTimeValue(nextTime, value))}
        minValue={timeBounds.minValue}
        maxValue={timeBounds.maxValue}
        minuteStep={minuteStep}
        format={format}
        disabled={disabled}
        className='min-w-0 grow basis-1/3'
      />
    </ButtonGroup>
  );
}

export interface DateTimePickerInputProps
  extends
    Pick<
      DateTimePickerProps,
      'id' | 'value' | 'onValueChange' | 'minValue' | 'maxValue' | 'minuteStep' | 'format' | 'disabled' | 'className'
    >,
    Pick<TimePickerInputProps, 'showTrigger' | 'showClear'>,
    Pick<DatePickerProps, 'captionLayout' | 'startMonth' | 'endMonth'> {}

export function DateTimePickerInput({
  id,
  className,
  onValueChange,
  value,
  minValue,
  maxValue,
  minuteStep,
  format,
  showTrigger = true,
  showClear = false,
  captionLayout,
  startMonth,
  endMonth,
  disabled,
}: DateTimePickerInputProps) {
  const timeBounds = getTimeBoundsForDate(value, minValue, maxValue);

  return (
    <ButtonGroup className={cn('w-full', className)}>
      <DatePickerInput
        id={id ? `${id}-date` : undefined}
        value={value}
        onValueChange={(nextDate) => onValueChange?.(mergeDateValue(nextDate, value))}
        minValue={minValue}
        maxValue={maxValue}
        showTrigger={showTrigger}
        showClear={showClear}
        captionLayout={captionLayout}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={disabled}
        className='min-w-0 grow basis-2/3'
      />
      <TimePickerInput
        id={id ? `${id}-time` : undefined}
        value={value}
        onValueChange={(nextTime) => onValueChange?.(mergeTimeValue(nextTime, value))}
        minValue={timeBounds.minValue}
        maxValue={timeBounds.maxValue}
        minuteStep={minuteStep}
        format={format}
        showTrigger={showTrigger}
        disabled={disabled}
        className='min-w-0 grow basis-1/3'
      />
    </ButtonGroup>
  );
}

function mergeDateValue(nextDate: Date | null, currentValue: Date | null | undefined) {
  if (!nextDate) return null;
  const next = (currentValue ? new Date(currentValue) : new Date(nextDate)).setFullYear(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );
  return new Date(next);
}

function mergeTimeValue(nextTime: Date | null, currentValue: Date | null | undefined) {
  if (!nextTime) return null;
  const next = (currentValue ? new Date(currentValue) : new Date(nextTime)).setHours(
    nextTime.getHours(),
    nextTime.getMinutes(),
    0,
    0,
  );
  return new Date(next);
}
