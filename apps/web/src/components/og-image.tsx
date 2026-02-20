import type { Metadata } from 'next';
import { PakloIcon } from '@/components/logos';
import { cn } from '@/lib/utils';
import { config } from '@/site-config';

/**
 * Wraps the Open Graph image component with additional styling and layout properties.
 *
 * @param children - The content to be rendered inside the wrapper.
 * @param props - Additional props to be spread onto the wrapper div element.
 * @returns The wrapped Open Graph image component.
 */
export function OpenGraphImageWrapper({
  children,
  style,
  className,
  tw,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const resolvedClassName = cn('h-full w-full flex items-center justify-center', className, tw);
  return (
    <div className={resolvedClassName} tw={resolvedClassName} {...props}>
      {children}
    </div>
  );
}

type OpenGraphImageMarketingProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'title' | 'children'> &
  ({ title?: string; description?: string } | { metadata: Metadata });
export function OpenGraphImageMarketing({ style, className, tw, ...props }: OpenGraphImageMarketingProps) {
  let title: string | undefined, description: string | undefined;
  if ('metadata' in props) {
    const metadata = props.metadata;
    if (metadata.title) {
      if (typeof metadata.title === 'string') {
        title = metadata.title;
      } else if ('absolute' in metadata.title) {
        title = metadata.title.absolute;
      } else if ('default' in metadata.title) {
        title = metadata.title.default;
      }
    }
    description = metadata.description ?? undefined;
  } else {
    title = props.title;
    description = props.description;
  }
  title ??= config.title;
  description ??= config.description;

  // trim description to 140 characters to ensure it fits, and append ellipsis if it was trimmed
  if (description.length > 140) {
    description = `${description.slice(0, 140)}…`;
  }

  const resolvedClassName = cn(
    'h-full w-full flex flex-row items-center justify-center bg-[#0a0a0a] p-20 text-white',
    className,
    tw,
  );
  return (
    <div
      // tw='gap-[60px] or tw='gap-15' do not work
      style={{ ...style, gap: '60px' }}
      className={resolvedClassName}
      tw={resolvedClassName}
      {...props}
    >
      <div tw='flex items-center justify-center'>
        <PakloIcon width={280} height={280} fill='#2E6417' />
      </div>

      <div tw='w-1 h-88 bg-[#2E6417] opacity-30' />

      <div tw='flex flex-col justify-center'>
        <p tw='text-5xl font-bold tracking-tight'>{title}</p>
        <p tw='text-3xl text-gray-400 max-w-xl leading-snug mt-4'>{description}</p>
        <p tw='text-xl text-gray-400 mt-4'>{config.domain}</p>
      </div>
    </div>
  );
}

type OpenGraphImageDocsProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'title' | 'children'> & {
  doc: { data: { title: string; description?: string } };
  site?: string;
};
export function OpenGraphImageDocs({
  style,
  className,
  tw,
  doc: {
    data: { title, description },
  },
  site = config.title,
  ...props
}: OpenGraphImageDocsProps) {
  // trim description to 240 characters to ensure it fits, and append ellipsis if it was trimmed
  description ??= '';
  if (description.length > 240) {
    description = `${description.slice(0, 240)}…`;
  }

  const resolvedClassName = cn(
    'h-full w-full flex flex-col justify-center bg-[#0c0c0c] p-16 text-white',
    className,
    tw,
  );
  return (
    <div
      style={{
        ...style,
        backgroundImage: 'linear-gradient(to top right, rgba(70, 150, 30, 0.5), transparent)',
      }}
      className={resolvedClassName}
      tw={resolvedClassName}
      {...props}
    >
      <div tw='flex flex-row items-center mb-3'>
        <PakloIcon width={48} height={48} />
        <p tw='ml-4 text-3xl text-white tracking-tight'>{site}</p>
      </div>

      <p tw='text-5xl font-bold tracking-tight'>{title}</p>
      <p tw='text-3xl text-gray-300'>{description}</p>
    </div>
  );
}
