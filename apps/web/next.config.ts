import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const config: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  cacheComponents: true,
  logging: { fetches: { fullUrl: true } }, // allows us to see cache behavior for fetches
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // do not need image optimization yet
  },
  experimental: {
    authInterrupts: true, // needed to use forbidden() and unauthorized()
  },
  async headers() {
    return [
      // security headers
      {
        source: '/(.*)', // applies to all routes
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }, // 1 year
          {
            // Stripe, Maps, and Help Scout Beacon require additional origins in CSP.
            // https://docs.stripe.com/security/guide#content-security-policy
            // https://docs.helpscout.com/article/815-csp-settings-for-beacon
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              img-src 'self' data: https: https://*.gravatar.com https://beacon-v2.helpscout.net https://d33v4339jhl8k0.cloudfront.net https://chatapi-prod.s3.amazonaws.com;
              script-src 'self' 'unsafe-inline' https://*.vercel-scripts.com https://vercel.live https://*.js.stripe.com https://js.stripe.com https://maps.googleapis.com https://beacon-v2.helpscout.net;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://beacon-v2.helpscout.net;
              font-src 'self' data: https://fonts.gstatic.com https://beacon-v2.helpscout.net;
              connect-src 'self' https://*.vercel-scripts.com https://api.stripe.com https://maps.googleapis.com https://beaconapi.helpscout.net https://chatapi.helpscout.net https://d3hb14vkzrxvla.cloudfront.net https://sockjs-helpscout.pusher.com wss://*.pusher.com;
              frame-src https://vercel.live https://*.js.stripe.com https://js.stripe.com https://hooks.stripe.com https://beacon-v2.helpscout.net;
              media-src https://beacon-v2.helpscout.net;
              frame-ancestors 'none';
              object-src 'none';
              `
              .replace(/\n/g, ' ')
              .trim(),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'paklo.app' }],
        destination: `https://www.paklo.app/:path*`,
        permanent: true,
      },
      {
        source: '/legal',
        destination: '/legal/terms',
        permanent: false,
      },
    ];
  },
};

const withMDX = createMDX();
export default withWorkflow(withMDX(config));
