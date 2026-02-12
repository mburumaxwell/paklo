import { vercelAdapter } from '@flags-sdk/vercel';
import type { FlagValuesType } from 'flags';
import { flag } from 'flags/next';

export const enableHomePageStats = flag({
  key: 'enable-home-page-stats',
  defaultValue: true,
  // decide: () => true,
  adapter: vercelAdapter(),
});

export const enableDependabotConnectivityCheck = flag({
  key: 'enable-dependabot-connectivity-check',
  defaultValue: Boolean(process.env.DEPENDABOT_ENABLE_CONNECTIVITY_CHECK || '1'),
  // decide: () => true,
  adapter: vercelAdapter(),
});

// Add more feature flags here as needed

export async function getFlagValues(): Promise<FlagValuesType> {
  return {
    // 'enable-home-page-stats': await enableHomePageStats(),
    // 'enable-dependabot-connectivity-check': await enableDependabotConnectivityCheck(),
  };
}
export { FlagValues } from 'flags/react';
