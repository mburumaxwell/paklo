---
"@paklo/core": patch
---

Set `NODE_OPTIONS` to increase V8 heap for large monorepos
The updater container has an 8GB memory limit (`UPDATER_MAX_MEMORY`), but Node.js V8 auto-scaling caps heap at ~2GB for containers above 4GB. This leaves ~6GB of allocated container memory unused while pnpm/npm crash with "JavaScript heap out of memory" on large monorepos (100+ workspace packages) during lockfile regeneration.

Set `NODE_OPTIONS=--max-old-space-size=4096` to allow V8 to use up to 4GB (half the container limit), leaving room for Ruby and other processes.

Related:

- <https://github.com/github/dependabot-action/commit/bbdee8a6bf002827e0828bdab7ab26773518f2bd>
- <https://github.com/dependabot/dependabot-core/issues/14596>
