# Contributing

Thank you for contributing to Paklo!

**📚 Complete contribution guide: [www.paklo.app/docs/contributing](https://www.paklo.app/docs/contributing)**

## Quick Start

1. Fork the repository
2. Clone your fork and move into the project directory
3. Use the Node version from `.nvmrc`, then install dependencies
   ```bash
   git clone https://github.com/<your-username>/paklo.git
   cd paklo
   nvm use
   corepack enable
   pnpm install
   ```
4. Make your changes
5. Run `pnpm build`
6. Run quality checks:
   ```bash
   pnpm lint
   pnpm test
   pnpm run format
   ```
7. Submit a pull request
