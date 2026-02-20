import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { OpenGraphImageDocs } from '@/components/og-image';
import { legal } from '@/lib/fumadocs';

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function Image(props: PageProps<'/legal/[slug]'>) {
  const { slug } = await props.params;
  const doc = legal.getPage([slug]);
  if (!doc) return notFound();

  return new ImageResponse(<OpenGraphImageDocs doc={doc} />, { ...size });
}

export function generateStaticParams() {
  return legal.getPages().map((doc) => ({ slug: doc.slugs[0] }));
}
