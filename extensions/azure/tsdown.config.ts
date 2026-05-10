import { defineConfig, type UserConfig } from 'tsdown';

const base: UserConfig = {
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  clean: true,
  dts: true, // required to make watch work
  sourcemap: true,
  deps: {
    alwaysBundle: [/.*/], // bundle all deps; each task folder must be self-contained (no npm install on agent)
    neverBundle: ['cpu-features'], // native addon — ssh2 catches the MODULE_NOT_FOUND error via try/catch
    onlyBundle: false, // suppress the "unintended bundling" hint; we are intentionally bundling all deps
  },
};

export default defineConfig([
  // each task is downloaded as a folder so it must have everything
  { ...base, entry: { index: 'src/v1/main.ts' }, outDir: 'tasks/dependabot/dependabotV1/dist/main' },
  { ...base, entry: { index: 'src/v2/main.ts' }, outDir: 'tasks/dependabot/dependabotV2/dist/main' },
  { ...base, entry: { index: 'src/v2/cleanup.ts' }, outDir: 'tasks/dependabot/dependabotV2/dist/cleanup' },
  { ...base, entry: { index: 'src/metadata/main.ts' }, outDir: 'tasks/metadata/DependabotFetchMetadataV1/dist/main' },
]);
