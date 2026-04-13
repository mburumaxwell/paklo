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

    // special files
    '.changeset',
    '.vscode/settings.json',
    'extensions/azure/**/*.json',
    'packages/core/docker/containers.json',
    'packages/core/fixtures',
    'package.json',
  ],
  sortImports: {},
});
