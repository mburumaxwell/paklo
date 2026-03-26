'use client';

import { format, parseISO } from 'date-fns';
import { CalendarIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant' | 'value'>,
    Pick<React.ComponentProps<typeof Calendar>, 'captionLayout' | 'startMonth' | 'endMonth'> {
  /** The currently selected date. This should be a Date object or null if no date is selected. */
  value?: Date | null;

  /** Called when the user selects a date. The date will be null if the user clears their selection. */
  onValueChange?: (date: Date | null) => void;

  /** Minimum selectable date. Dates before this will be disabled. */
  minValue?: Date;

  /** Maximum selectable date. Dates after this will be disabled. */
  maxValue?: Date;
}
export function DatePicker({
  className,
  onValueChange,
  value,
  minValue,
  maxValue,
  captionLayout,
  startMonth,
  endMonth,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant='outline' className={cn('justify-between', className)} {...props}>
            {value ? value.toLocaleDateString() : 'Select date'}
            <ChevronDownIcon />
          </Button>
        }
      />
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={value ?? undefined}
          captionLayout={captionLayout}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={[
            // disable dates outside of the min/max range, if provided
            ...(minValue ? [{ before: minValue }] : []),
            ...(maxValue ? [{ after: maxValue }] : []),
          ]}
          onSelect={(date) => {
            onValueChange?.(date || null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DatePickerInputProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof InputGroupInput>, 'value' | 'onChange'>,
    Pick<
      DatePickerProps,
      'value' | 'onValueChange' | 'minValue' | 'maxValue' | 'captionLayout' | 'startMonth' | 'endMonth'
    > {
  showTrigger?: boolean;
  showClear?: boolean;
}
export function DatePickerInput({
  value,
  onValueChange,
  minValue,
  maxValue,
  showTrigger = true,
  showClear = false,
  captionLayout,
  startMonth,
  endMonth,
  disabled,
  className,
  ...props
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);

  // <input type="date"> expects a local calendar date, not a UTC timestamp-derived date string.
  const inputValue = value ? format(value, 'yyyy-MM-dd') : '';

  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        type='date'
        {...props}
        value={inputValue}
        min={minValue ? format(minValue, 'yyyy-MM-dd') : undefined}
        max={maxValue ? format(maxValue, 'yyyy-MM-dd') : undefined}
        onChange={(e) => onValueChange?.(e.target.value ? parseISO(e.target.value) : null)}
        disabled={disabled}
      />
      <InputGroupAddon align='inline-end'>
        {showTrigger && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              disabled={disabled}
              render={
                <InputGroupButton variant='ghost' size='icon-xs' aria-label='Select date'>
                  <CalendarIcon />
                  <span className='sr-only'>Select date</span>
                </InputGroupButton>
              }
            />
            <PopoverContent className='w-auto p-0'>
              <Calendar
                mode='single'
                selected={value ?? undefined}
                captionLayout={captionLayout}
                startMonth={startMonth}
                endMonth={endMonth}
                disabled={[
                  // disable dates outside of the min/max range, if provided
                  ...(minValue ? [{ before: minValue }] : []),
                  ...(maxValue ? [{ after: maxValue }] : []),
                ]}
                onSelect={(date) => {
                  onValueChange?.(date ?? null);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
        {showClear && value && (
          <InputGroupButton
            variant='ghost'
            size='icon-xs'
            aria-label='Clear date'
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
