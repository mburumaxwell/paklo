import { ImageResponse } from 'next/og';

import { OpenGraphImageMarketing } from '@/components/og-image';

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function Image() {
  return new ImageResponse(<OpenGraphImageMarketing />, { ...size });
}
