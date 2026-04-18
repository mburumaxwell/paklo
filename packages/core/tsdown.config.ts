import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  tsconfig: true,
  dts: true,
  sourcemap: true,
  entry: [
    // base
    'src/keygen.ts',
    'src/logger.ts',

    // dependabot
    'src/github/index.ts',
    'src/dependabot/index.ts',
    'src/azure/index.ts',
    'src/azure/config.ts',

    // runner
    'src/runner/index.ts',
    'src/runner/local/index.ts',
    'src/runner/local/azure/index.ts',
  ],
});
