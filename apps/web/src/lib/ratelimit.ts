import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimiterType = 'mapbox';

const redis = Redis.fromEnv();
const limiters = new Map<RateLimiterType, Ratelimit>([
  [
    'mapbox',
    new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3_000, '1h'),
    }),
  ],
]);

export const getRatelimiter = (key: RateLimiterType) => limiters.get(key);
