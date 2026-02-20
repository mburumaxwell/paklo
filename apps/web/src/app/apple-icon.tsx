import { ImageResponse } from 'next/og';
import { PakloIconOpenGraph } from '@/components/logos';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<PakloIconOpenGraph />, { ...size });
}
