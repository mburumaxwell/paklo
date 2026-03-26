'use client';

import { format } from 'date-fns';
import { ChevronDownIcon, Clock3Icon, XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isValidDateValue } from '@/lib/dates';
import { cn } from '@/lib/utils';

const HOURS_12 = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const DEFAULT_MINUTE_STEP = 5;
type TimeFormat = '12-hour' | '24-hour';

export interface TimePickerProps extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant' | 'value'> {
  /** The currently selected time. This should be a Date object or null if no time is selected. */
  value?: Date | null;

  /** Called when the user selects a time. The time will be null if the user clears their selection. */
  onValueChange?: (date: Date | null) => void;

  /** Minimum selectable time. Times before this will be disabled. */
  minValue?: Date;

  /** Maximum selectable time. Times after this will be disabled. */
  maxValue?: Date;

  /** The minute increment used by the picker controls. */
  minuteStep?: number;

  /** The display format used by the picker. Defaults to 24-hour. */
  format?: TimeFormat;
}

export function TimePicker({
  className,
  onValueChange,
  value,
  minValue,
  maxValue,
  minuteStep,
  format = '24-hour',
  disabled,
  ...props
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button variant='outline' className={cn('justify-between', className)} disabled={disabled} {...props}>
            {formatTimeLabel(value, format) || 'Select time'}
            <ChevronDownIcon />
          </Button>
        }
      />
      <PopoverContent className='w-auto p-0'>
        <TimePickerPopoverContent
          value={value}
          onValueChange={onValueChange}
          minValue={minValue}
          maxValue={maxValue}
          minuteStep={minuteStep}
          format={format}
          disabled={disabled}
          onComplete={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface TimePickerInputProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof InputGroupInput>, 'type' | 'value' | 'onChange'>,
    Pick<TimePickerProps, 'value' | 'onValueChange' | 'minValue' | 'maxValue' | 'minuteStep' | 'format'> {
  showTrigger?: boolean;
  showClear?: boolean;
}

export function TimePickerInput({
  value,
  onValueChange,
  minValue,
  maxValue,
  minuteStep = DEFAULT_MINUTE_STEP,
  format = '24-hour',
  showTrigger = true,
  showClear = false,
  disabled,
  className,
  ...props
}: TimePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const step = normalizeMinuteStep(minuteStep);
  const [draftTextValue, setDraftTextValue] = React.useState<string | null>(null);
  const textValue = draftTextValue ?? formatTimeLabel(value, format);

  function commitTextValue() {
    if (!textValue.trim()) {
      onValueChange?.(null);
      setDraftTextValue(null);
      return;
    }

    const nextValue = parseTimeLabel(textValue, value, format);
    if (!nextValue || isTimeOutsideRange(nextValue, minValue, maxValue)) {
      setDraftTextValue(null);
      return;
    }

    onValueChange?.(nextValue);
    setDraftTextValue(null);
  }

  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        type={format === '24-hour' ? 'time' : 'text'}
        {...props}
        value={format === '24-hour' ? formatTimeValue(value) : textValue}
        min={format === '24-hour' ? formatTimeValue(minValue) || undefined : undefined}
        max={format === '24-hour' ? formatTimeValue(maxValue) || undefined : undefined}
        step={format === '24-hour' ? step * 60 : undefined}
        placeholder={format === '12-hour' ? 'hh:mm aa' : undefined}
        onChange={(e) => {
          if (format === '24-hour') {
            onValueChange?.(parseTimeValue(e.target.value, value));
            return;
          }

          setDraftTextValue(e.target.value);
        }}
        onBlur={(e) => {
          if (format === '12-hour') {
            commitTextValue();
          }

          props.onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (format === '12-hour' && e.key === 'Enter') {
            commitTextValue();
          }

          props.onKeyDown?.(e);
        }}
        disabled={disabled}
      />
      <InputGroupAddon align='inline-end'>
        {showTrigger && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              disabled={disabled}
              render={
                <InputGroupButton variant='ghost' size='icon-xs' aria-label='Select time'>
                  <Clock3Icon />
                  <span className='sr-only'>Select time</span>
                </InputGroupButton>
              }
            />
            <PopoverContent className='w-auto p-0'>
              <TimePickerPopoverContent
                value={value}
                onValueChange={onValueChange}
                minValue={minValue}
                maxValue={maxValue}
                minuteStep={step}
                format={format}
                disabled={disabled}
                onComplete={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            </PopoverContent>
          </Popover>
        )}
        {showClear && value && (
          <InputGroupButton
            variant='ghost'
            size='icon-xs'
            aria-label='Clear time'
            disabled={disabled}
            onClick={() => onValueChange?.(null)}
          >
            <XIcon className='pointer-events-none' />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}

interface TimePickerContentProps extends Pick<
  TimePickerProps,
  'value' | 'onValueChange' | 'minValue' | 'maxValue' | 'minuteStep' | 'format'
> {
  disabled?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

function TimePickerPopoverContent({
  value,
  onValueChange,
  minValue,
  maxValue,
  minuteStep = DEFAULT_MINUTE_STEP,
  format = '24-hour',
  disabled,
  onComplete,
  onCancel,
}: TimePickerContentProps) {
  const step = normalizeMinuteStep(minuteStep);
  const [draft, setDraft] = React.useState(() => getTimeDraft(value, step, format));
  const isDraftInvalid = isDraftOutsideRange(draft, minValue, maxValue, format);

  return (
    <div className={cn('flex w-auto flex-col gap-3 p-3', format === '12-hour' ? 'min-w-80' : 'min-w-56')}>
      <FieldGroup className={cn('grid gap-2', format === '12-hour' ? 'grid-cols-3' : 'grid-cols-2')}>
        <Field>
          <FieldLabel>Hour</FieldLabel>
          <Select
            value={draft.hour}
            onValueChange={(nextValue) => nextValue && setDraft({ ...draft, hour: nextValue })}
          >
            <SelectTrigger className='w-full' disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(format === '12-hour' ? HOURS_12 : HOURS_24).map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Minute</FieldLabel>
          <Select
            value={draft.minute}
            onValueChange={(nextValue) => nextValue && setDraft({ ...draft, minute: nextValue })}
          >
            <SelectTrigger className='w-full' disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {getMinuteValues(step).map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {format === '12-hour' && (
          <Field>
            <FieldLabel>Period</FieldLabel>
            <Select
              value={draft.period}
              onValueChange={(nextValue) =>
                nextValue === 'AM' || nextValue === 'PM' ? setDraft({ ...draft, period: nextValue }) : undefined
              }
            >
              <SelectTrigger className='w-full' disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='AM'>AM</SelectItem>
                  <SelectItem value='PM'>PM</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}
      </FieldGroup>
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' size='sm' onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
        <Button
          size='sm'
          onClick={() => {
            onValueChange?.(createTimeValue(draft, value, format));
            onComplete?.();
          }}
          disabled={disabled || isDraftInvalid}
        >
          OK
        </Button>
      </div>
    </div>
  );
}

const formatTimeValue = (value: Date | null | undefined) => (isValidDateValue(value) ? format(value, 'HH:mm') : '');
const normalizeMinuteStep = (step?: number) =>
  !step || !Number.isInteger(step) || step < 1 || step > 60 ? DEFAULT_MINUTE_STEP : step;
const formatTimeLabel = (value: Date | null | undefined, timeFormat: TimeFormat) =>
  isValidDateValue(value) ? format(value, timeFormat === '12-hour' ? 'hh:mm aa' : 'HH:mm') : '';

function getTimeDraft(value: Date | null | undefined, minuteStep: number, format: TimeFormat) {
  const date = isValidDateValue(value) ? new Date(value) : new Date();
  date.setMinutes(Math.floor(date.getMinutes() / minuteStep) * minuteStep, 0, 0);

  const hours = date.getHours();

  return {
    hour: String(format === '12-hour' ? hours % 12 || 12 : hours).padStart(2, '0'),
    minute: String(date.getMinutes()).padStart(2, '0'),
    period: hours >= 12 ? 'PM' : 'AM',
  } as const;
}

const getMinuteValues = (minuteStep: number) =>
  Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) =>
    String(Math.min(index * minuteStep, 59)).padStart(2, '0'),
  );

function createTimeValue(
  draft: { hour: string; minute: string; period: 'AM' | 'PM' },
  reference: Date | null | undefined,
  format: TimeFormat,
) {
  const hours =
    format === '24-hour' ? Number(draft.hour) : (Number(draft.hour) % 12) + (draft.period === 'PM' ? 12 : 0);
  const minutes = Number(draft.minute);
  const next = isValidDateValue(reference) ? new Date(reference) : new Date();
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function isDraftOutsideRange(
  draft: { hour: string; minute: string; period: 'AM' | 'PM' },
  minValue?: Date,
  maxValue?: Date,
  format: TimeFormat = '12-hour',
) {
  const totalMinutes =
    (format === '24-hour' ? Number(draft.hour) : (Number(draft.hour) % 12) + (draft.period === 'PM' ? 12 : 0)) * 60 +
    Number(draft.minute);
  const minMinutes = isValidDateValue(minValue) ? minValue.getHours() * 60 + minValue.getMinutes() : null;
  const maxMinutes = isValidDateValue(maxValue) ? maxValue.getHours() * 60 + maxValue.getMinutes() : null;

  return (minMinutes !== null && totalMinutes < minMinutes) || (maxMinutes !== null && totalMinutes > maxMinutes);
}

function isTimeOutsideRange(value: Date, minValue?: Date, maxValue?: Date) {
  const totalMinutes = value.getHours() * 60 + value.getMinutes();
  const minMinutes = isValidDateValue(minValue) ? minValue.getHours() * 60 + minValue.getMinutes() : null;
  const maxMinutes = isValidDateValue(maxValue) ? maxValue.getHours() * 60 + maxValue.getMinutes() : null;

  return (minMinutes !== null && totalMinutes < minMinutes) || (maxMinutes !== null && totalMinutes > maxMinutes);
}

function parseTimeLabel(value: string, reference: Date | null | undefined, format: TimeFormat) {
  if (format === '24-hour') return parseTimeValue(value, reference);

  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*([APap][Mm])$/);
  if (!match) return null;

  const [, rawHours, rawMinutes, rawPeriod = 'AM'] = match;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > 12 ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const next = isValidDateValue(reference) ? new Date(reference) : new Date();
  next.setHours((hours % 12) + (rawPeriod.toUpperCase() === 'PM' ? 12 : 0), minutes, 0, 0);
  return next;
}

function parseTimeValue(value: string, reference: Date | null | undefined) {
  if (!value) return null;

  const [rawHours, rawMinutes] = value.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  const next = (isValidDateValue(reference) ? new Date(reference) : new Date()).setHours(hours, minutes, 0, 0);
  return new Date(next);
}
