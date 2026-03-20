'use client';

import { intlFormatDistance } from 'date-fns';
import * as React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface TimeAgoProps extends Pick<React.ComponentPropsWithoutRef<'span'>, 'className'> {
  /**
   * The Date to display.
   * An actual Date object or something that can be fed to new Date
   */
  value: Date | number | string;

  /**
   * The locale to use for formatting the time ago string.
   * Leave as `undefined` to use the browser's default locale.
   * @default undefined
   */
  locale?: string;

  /**
   * Cutoff in milliseconds to switch to absolute date formatting.
   * @default 7 days.
   */
  cutoff?: number;

  /**
   * Whether to show the tooltip with exact date and time on hover.
   * @default true
   */
  showTooltip?: boolean;
}

export function TimeAgo({
  value,
  locale,
  cutoff = 7 * 24 * 60 * 60 * 1000,
  showTooltip = true,
  className,
  ...props
}: TimeAgoProps) {
  const date = new Date(value);
  const ms = date.getTime();
  const isValidDate = Number.isFinite(ms);

  const [now, setNow] = React.useState(() => Date.now());

  const absoluteFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }),
    [locale],
  );

  const [localDateTimeFormatter, utcDateTimeFormatter] = React.useMemo(
    () => [
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }),
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short',
      }),
    ],
    [locale],
  );

  const age = isValidDate ? Math.abs(now - ms) : 0;
  const refreshInterval = age < 60_000 ? 1_000 : age < 3_600_000 ? 60_000 : age < 86_400_000 ? 3_600_000 : 86_400_000;

  React.useEffect(() => {
    if (!isValidDate) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), refreshInterval);
    return () => window.clearInterval(intervalId);
  }, [isValidDate, refreshInterval]);

  if (!isValidDate) return null;

  const text =
    age >= cutoff
      ? absoluteFormatter.format(date)
      : intlFormatDistance(date, now, { locale, numeric: 'auto', style: 'long' });
  const localDateTime = localDateTimeFormatter.format(date);
  const utcDateTime = utcDateTimeFormatter.format(date);

  function TimeComponent() {
    return (
      <time className={className} dateTime={date.toISOString()} suppressHydrationWarning {...props}>
        {text}
      </time>
    );
  }

  if (!showTooltip) return <TimeComponent />;

  return (
    <Tooltip>
      <TooltipTrigger>
        <TimeComponent />
      </TooltipTrigger>
      <TooltipContent className='max-w-none py-2'>
        <div className='grid min-w-64 grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
          <div className='rounded bg-background/10 px-1.5 py-0.5 font-medium tracking-wide uppercase'>Local</div>
          <div>{localDateTime}</div>
          <div className='rounded bg-background/10 px-1.5 py-0.5 font-medium tracking-wide uppercase'>UTC</div>
          <div>{utcDateTime}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
