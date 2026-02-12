import { vercelAdapter } from '@flags-sdk/vercel';
import { flag } from 'flags/next';

export const enableHomePageStats = flag({
  key: 'enable-home-page-stats',
  defaultValue: true,
  adapter: vercelAdapter(),
});

export const enableDependabotDebug = flag({
  key: 'enable-dependabot-debug',
  defaultValue: false,
  decide: () => false,
});

export const enableDependabotConnectivityCheck = flag({
  key: 'enable-dependabot-connectivity-check',
  defaultValue: Boolean(process.env.DEPENDABOT_ENABLE_CONNECTIVITY_CHECK || '1'),
  decide: () => true,
});

// Add more feature flags here as needed
