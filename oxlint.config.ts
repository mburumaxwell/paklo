import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'oxc', 'react', 'nextjs', 'import'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'no-unused-vars': 'error',
    'no-unused-expressions': 'error',
    'no-constant-binary-expression': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/dot-notation': 'error',
    'react/no-danger': 'error',
    'import/no-duplicates': 'error',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
  ignorePatterns: [
    // exclude git submodules
    'dependabot-action',
    'dependabot-cli',

    // shadcn components (generated and diff checked)
    'apps/web/src/components/ui',
    'apps/web/src/components/stepper.tsx',
    'apps/web/src/hooks/use-mobile.ts',
  ],
});
