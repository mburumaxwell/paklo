import { defineConfig } from 'oxfmt';

export default defineConfig({
  useTabs: false,
  printWidth: 120,
  singleQuote: true,
  jsxSingleQuote: true,
  quoteProps: 'consistent',
  ignorePatterns: [
    // everything in .gitignore is ignored by default
    // no need to repeat it here

    // exclude git submodules
    'dependabot-action',
    'dependabot-cli',

    // agent skills (imported via npx skills and diff checked)
    '.agents/skills',

    // static files
    'public',
    'static',

    // shadcn components (generated and diff checked)
    'apps/web/src/components/ui',
    'apps/web/src/components/stepper.tsx',
    'apps/web/src/hooks/use-mobile.ts',
    'apps/web/src/app/globals.css',

    // special files
    '.changeset/config.json',
    '.vscode/settings.json',
    'extensions/azure/**/*.json',
    'packages/runner/docker/containers.json',
    'packages/core/fixtures',
    'package.json',
  ],
  sortImports: {},
  sortTailwindcss: {
    stylesheet: 'apps/web/src/app/globals.css',
    functions: ['clsx', 'cn'],
    preserveWhitespace: true,
  },
});
