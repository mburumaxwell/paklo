import type { z } from '@/lib/zod';

export type Period = z.infer<ReturnType<typeof z.period>>;
