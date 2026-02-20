import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { OpenGraphImageDocs } from '@/components/og-image';
import { docs, getPageImage } from '@/lib/fumadocs';
import { config } from '@/site-config';

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export async function GET(_req: Request, props: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await props.params;
  const doc = docs.getPage(slug.slice(0, -1));
  if (!doc) return notFound();

  return new ImageResponse(<OpenGraphImageDocs doc={doc} site={config.docs.title} />, { ...size });
}

export function generateStaticParams() {
  return docs.getPages().map((doc) => ({
    lang: doc.locale,
    slug: getPageImage(doc).segments,
  }));
}
