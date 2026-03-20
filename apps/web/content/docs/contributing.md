---
title: Contributing
description: Guidelines for developing and submitting changes.
---

<!-- We welcome contributions to the Paklo project here's how you can contribute effectively. -->

## Contribution Workflow

1. Fork the project
2. Set up your [development environment](#development-setup)
3. Make your feature addition or bug fix
4. Ensure all [quality checks](#quality-checks) pass
5. Submit a pull request

## Development Setup

- Use the Node version from `.nvmrc`
- Install [pnpm](https://pnpm.io)
- Install [Docker](https://www.docker.com) (for CLI and extension development)

### Local setup

Clone your fork first, then use the Node version from `.nvmrc` before installing dependencies or running scripts:

```bash
# Clone your fork
git clone https://github.com/mburumaxwell/paklo.git
cd paklo

# Use the project Node version and install dependencies
nvm use
corepack enable
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Quality Checks

Before submitting a pull request, ensure these checks pass:

### Linting

```bash
pnpm lint
```

### Tests

```bash
pnpm test
```

### Formatting

```bash
pnpm format              # check for formatting issues
pnpm format:fix          # fix formatting issues
```

### Spelling

```bash
pip install codespell
codespell                   # check for misspellings
codespell --write-changes   # fix misspellings
```

## Submitting Changes

1. Fork the repository and create your branch from `main`
2. Make your changes and ensure all quality checks pass
3. Write clear, descriptive commit messages
4. Open a pull request with a clear description of your changes
