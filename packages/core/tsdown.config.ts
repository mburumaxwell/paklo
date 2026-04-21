import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  tsconfig: true,
  dts: true,
  sourcemap: true,
  entry: [
    // base
    'src/logger.ts',

    // dependabot
    'src/github/index.ts',
    'src/dependabot/index.ts',

    // runner
    'src/local/index.ts',
    'src/runner/index.ts',

    // azure
    'src/azure/index.ts',
    'src/azure/client/index.ts',
    'src/azure/config.ts',
    'src/azure/runner/index.ts',
  ],
});
