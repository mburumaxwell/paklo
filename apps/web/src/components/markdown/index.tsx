import type { MDXComponents, MDXProps } from 'mdx/types';
import type * as React from 'react';

import { createRelativeLink, defaultMdxComponents } from '@/components/docs';
import type { LoaderConfig, LoaderOutput, Page } from '@/lib/fumadocs';
import { cn } from '@/lib/utils';

import { Mermaid } from './mermaid';

type FumadocsExtras<C extends LoaderConfig> = {
  /** The source loader used to load the page */
  source: LoaderOutput<C>;
  /** The current page being rendered */
  page: Page;
};
type MarkdownPropsBase = { body: React.FC<MDXProps>; className?: string; components?: MDXComponents };
// this union type ensures that both 'source' and 'page' are provided together or neither is provided
export type MarkdownProps<C extends LoaderConfig> = MarkdownPropsBase | (MarkdownPropsBase & FumadocsExtras<C>);

export function Markdown<C extends LoaderConfig>({ body: Mdx, className, components, ...props }: MarkdownProps<C>) {
  return (
    <div className={cn('dark:prose-invert prose max-w-none', className)} data-mdx-content>
      <Mdx
        components={getMDXComponents({
          ...('source' in props && 'page' in props
            ? {
                // this allows you to link to other pages with relative file paths
                a: createRelativeLink(props.source, props.page),
              }
            : {}),
          ...components,
        })}
      />
    </div>
  );
}

// use this function to get MDX components, you will need it for rendering MDX
function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  };
}
