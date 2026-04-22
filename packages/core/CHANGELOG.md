# @paklo/core

## 0.19.0

### Minor Changes

- [#2705](https://github.com/mburumaxwell/paklo/pull/2705) [`68ddd4e`](https://github.com/mburumaxwell/paklo/commit/68ddd4ea2f413fcaf1ce0b18fb37a9ac215c7c4c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add first-stage multi-ecosystem update support.
  This includes validating group usage in config, merging effective group/update settings for branching and PR metadata, and propagating `multi-ecosystem-update` through jobs and usage telemetry.

- [`425f1c8`](https://github.com/mburumaxwell/paklo/commit/425f1c85f1bd7c1317bf2c4a81fa25be009dfad6) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Checking if a PR has been edited externally should check all commits and not just one.

### Patch Changes

- [`03d4b4c`](https://github.com/mburumaxwell/paklo/commit/03d4b4ca243014d973191ee65ceb002bdb298fb5) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Fix Azure DevOps Server custom-port handling.
  This is done by preserving bare `hostname` and connectable `host`, then passing the port-aware host into Dependabot jobs.

- [#2698](https://github.com/mburumaxwell/paklo/pull/2698) [`a474cea`](https://github.com/mburumaxwell/paklo/commit/a474ceabe3887ec57f1117ba571ba00fe7f4fcdc) Thanks [@patest-dev](https://github.com/patest-dev)! - Updated Azure DevOps PR linking syntax

- [#2704](https://github.com/mburumaxwell/paklo/pull/2704) [`9274828`](https://github.com/mburumaxwell/paklo/commit/92748283cd7a68ac065044a1ab3cdd4de6522ab8) Thanks [@dependabot](https://github.com/apps/dependabot)! - Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 32 updates

- [`a14908a`](https://github.com/mburumaxwell/paklo/commit/a14908a89d09554703b4240e4ecf03f90f857d70) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Fix where startGroup and endGroup logic for logs

## 0.18.0

### Minor Changes

- [`01ec8c7`](https://github.com/mburumaxwell/paklo/commit/01ec8c73408ac8593d46c76088e2384d01400851) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - No longer exporting hono server logic

- [`5527ff5`](https://github.com/mburumaxwell/paklo/commit/5527ff5d3d31124d12bbaf4f27c26edb26bc16cd) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Introduced better logger, not all logs are handled with pino.
  Defaults to console unless replaced. This helps us avoid exporting pino in places we should not and will allow later for using different logging tools in each area of tools.

- [`13f507a`](https://github.com/mburumaxwell/paklo/commit/13f507a9ef3170953cb90cc5f7957ac5431f6175) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add support for logging groups and sections.
  This used to be supported earlier but removed when we moved from `dependabot/cli` to our own CLI. This re-adds it.

- [`8052857`](https://github.com/mburumaxwell/paklo/commit/80528572578491931cf4f24010f9b3de2bd1497d) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Reorganize files for easier grouping and exports

## 0.17.1

### Patch Changes

- [#2695](https://github.com/mburumaxwell/paklo/pull/2695) [`25d5095`](https://github.com/mburumaxwell/paklo/commit/25d5095158d953b00e24533d5cbdca7bf3c33669) Thanks [@dependabot](https://github.com/apps/dependabot)! - Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 32 updates

- [`67f1ff6`](https://github.com/mburumaxwell/paklo/commit/67f1ff6d52f24f6dc264570ee638432411f88bec) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - No longer export usage types

## 0.17.0

### Minor Changes

- [`0e57445`](https://github.com/mburumaxwell/paklo/commit/0e57445d1f4a2761188d1087b8d25f4a9bcc3326) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Merge runner package into core

- [`8dac66b`](https://github.com/mburumaxwell/paklo/commit/8dac66b09f4621c9b328dbdf9cff3805ad49d23c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Remove config export for azure from barrel export

- [`0473f0a`](https://github.com/mburumaxwell/paklo/commit/0473f0a501f5025561224ae21310e3e1884ea331) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - hono helper no longer exported from core as it is only used by the web

## 0.16.0

### Minor Changes

- [`7431349`](https://github.com/mburumaxwell/paklo/commit/743134945b0de6e641fcf632964f5beae14a5656) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add `nix` to package ecosystems/managers

## 0.15.0

### Minor Changes

- [`d92b912`](https://github.com/mburumaxwell/paklo/commit/d92b9124c494426832265b47c8bf7adc324e5d8b) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Graduate `pre-commit` ecosystem support from beta.
  Ref: https://github.com/dependabot/dependabot-core/pull/14341

- [`1f8a992`](https://github.com/mburumaxwell/paklo/commit/1f8a992a71aeb4276830349b2c1aa4713050b514) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Support the `dependency-removed` alongside `removed`.
  Ref: https://github.com/dependabot/cli/issues/593

- [`7810eed`](https://github.com/mburumaxwell/paklo/commit/7810eedad37f9e128a04e5336f0e9b431f973f57) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Support overriding group names with `IDENTIFIER` key.

### Patch Changes

- [#2625](https://github.com/mburumaxwell/paklo/pull/2625) [`d2b7fdc`](https://github.com/mburumaxwell/paklo/commit/d2b7fdc320684bcac8722bf42df5796f4d1d8272) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Remove legacy Azure pull request dependency property format support.

- [#2623](https://github.com/mburumaxwell/paklo/pull/2623) [`1b7d1da`](https://github.com/mburumaxwell/paklo/commit/1b7d1da4d73b106e9b7667c9cb41df7b395fcd25) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add support for `groups.<name>.group-by: dependency-name` and use shared branch naming logic for grouped multi-directory updates.

## 0.14.2

### Patch Changes

- [`e56fdbe`](https://github.com/mburumaxwell/paklo/commit/e56fdbed8baceb22b73e21907fa23039cc5809d9) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 16 March 2026

  As observed at https://github.com/mburumaxwell/paklo/actions/runs/23124920291

## 0.14.1

### Patch Changes

- [`37391ba`](https://github.com/mburumaxwell/paklo/commit/37391badfe38f536a1f7a782f83acbc826ad49a4) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 02 March 2026

## 0.14.0

### Minor Changes

- [`bc6cf84`](https://github.com/mburumaxwell/paklo/commit/bc6cf84b31da25a8611b0309d2a366d13ccdd4ef) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add support for 'pre-commit` ecosystem in beta
  See [dependabot-action#1621](https://github.com/github/dependabot-action/pull/1621), [dependabot-core#1524](https://github.com/dependabot/dependabot-core/issues/1524), and [dependabot-core#13977](https://github.com/dependabot/dependabot-core/pull/13977)

## 0.13.0

### Minor Changes

- [`942f6b0`](https://github.com/mburumaxwell/paklo/commit/942f6b0a4ad73ee32a8fed4dd64476e4f8a9fcf4) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update logic for dependabot commands, set default to update

- [#2474](https://github.com/mburumaxwell/paklo/pull/2474) [`13e7685`](https://github.com/mburumaxwell/paklo/commit/13e7685f7807620fc1896a56e6cd495360bab807) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Support new PR property format
  Add `pr-number` field to job schema while maintaining backward compatibility with legacy storage format. Reference [dependabot/cli#516](https://github.com/dependabot/cli/pull/516) and [dependabot/cli#527](https://github.com/dependabot/cli/pull/527)

- [#2475](https://github.com/mburumaxwell/paklo/pull/2475) [`5bb97c5`](https://github.com/mburumaxwell/paklo/commit/5bb97c509099d201a4a1e3e978016cf0330da237) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Implement PR superseding logic

- [#2472](https://github.com/mburumaxwell/paklo/pull/2472) [`e7ddb99`](https://github.com/mburumaxwell/paklo/commit/e7ddb996456b6b2758725a230f867c152f588ed0) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update URL parsing to enhance org extraction and allow repository extract from a repository url directly

### Patch Changes

- [`6219b9f`](https://github.com/mburumaxwell/paklo/commit/6219b9f15c982dc8ff124cc0a9e81d54769533ec) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 26 January 2026

- [`bc56968`](https://github.com/mburumaxwell/paklo/commit/bc569687bdbe54234e08533069e62b38225c86fa) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - graph command must have directories set hence pick them from directory if not set

## 0.12.1

### Patch Changes

- [`e957487`](https://github.com/mburumaxwell/paklo/commit/e957487c31d148a217465276eca1284dc2764d39) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 19 January 2026

## 0.12.0

### Minor Changes

- [#2404](https://github.com/mburumaxwell/paklo/pull/2404) [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Repository renamed to paklo

- [#2406](https://github.com/mburumaxwell/paklo/pull/2406) [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Updated documentation to catch up with months of changes

- [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Standard spelling for orgs (organization)
  Even though we should be using organisation, there are places we cannot change. Hence, we choose consistency.

### Patch Changes

- [#2405](https://github.com/mburumaxwell/paklo/pull/2405) [`79d860b`](https://github.com/mburumaxwell/paklo/commit/79d860bcc8a5d1cc3a8e4c0ffb9228be25986281) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 08 January 2026

## 0.11.1

### Patch Changes

- [#2365](https://github.com/mburumaxwell/paklo/pull/2365) [`f172ddf`](https://github.com/mburumaxwell/paklo/commit/f172ddffb28a8ebc4ad058f5bd411009eae3eb04) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `conda` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-conda-ecosystem-support-for-dependabot-now-generally-available/

- [#2368](https://github.com/mburumaxwell/paklo/pull/2368) [`32705f9`](https://github.com/mburumaxwell/paklo/commit/32705f958be5e00f08028977967645e0f9370572) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `opentofu` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-dependabot-version-updates-now-support-opentofu

- [#2366](https://github.com/mburumaxwell/paklo/pull/2366) [`26bcf23`](https://github.com/mburumaxwell/paklo/commit/26bcf23a6a7195c3ae9f5477222deb460a70091e) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `bazel` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-dependabot-version-updates-now-support-bazel

## 0.11.0

### Minor Changes

- dd14205: Only output logs from proxy if in debug mode. This is meant to reduce unnecessary logs output in Azure pipelines hence avoid low/no disk space errors.

### Patch Changes

- c55d8d1: Refactor URL handling in Azure DevOps client or prevent double encoding of project and repository names

## 0.10.0

### Minor Changes

- a28b3cf: Add method to get diff from commits
- 8d56957: Changes (renaming and moving things around) to support features in the hosted version

## 0.9.0

### Minor Changes

- e9b5d09: Extract and hence test functionality to get identity API url
- e9b5d09: Improve azure client request/response types with zod (schema validation in the future)
- e9b5d09: Make use of ky instead of direct fetch to improve retries and remove own HTTP client implementation

### Patch Changes

- 0fe301e: No longer expose random gen for job id, move it closer to where in use
- abf1f0e: Fix log level filtering with pino's multistream

## 0.8.0

### Minor Changes

- f279661: Require schedule to be present in the updates configuration.
  Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
  This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.

### Patch Changes

- 985700f: Set `enable_beta_ecosystems` experiment if the `enable-beta-ecosystems` is set in the config

## 0.7.3

### Patch Changes

- 59c83f7: Add support for `record_cooldown_meta` endpoint though unused
- d315af2: Support for conda ecosystem/manager (in beta)
  Official changelog (unpublished): https://github.blog/changelog/2025-09-16-conda-ecosystem-support-for-dependabot-now-generally-available
- 45e8456: Refactor logger implementation to support customizable options and multiple output streams

## 0.7.2

### Patch Changes

- c5fb405: Restore empty string for 'content_encoding' hence fix gomod issue
- 903ca2c: Add Docker container detection and update telemetry schema

## 0.7.1

### Patch Changes

- f6e7cd9: Update default experiments as of 23 November 2025
- 434bc91: Move environment and shared-date out of core for ease
- d79af62: Collect error messages for tracking where issues are coming from

## 0.7.0

### Minor Changes

- 5402afc: Support for `create_dependency_submission` requests.
  While these requests are doing nothing at this time, it helps keep similar request possibilities to avoid jobs failing because of 404 responses.
  This could also be used in the managed version to support SBOM or checking vulnerabilities.
- b24a07a: Use enum for dependabot close PR reason
- 3fcaa18: Add request inspection support for troubleshooting.
  - CLI `run` command can write raw Dependabot requests with `--inspect`, writing JSON snapshots under `./inspections`.
  - Core server accepts an optional inspect hook that records the raw request payload before processing.
- 80e7937: Support for `record_update_job_warning` by creating comments on modified pull requests.
  The `record_update_job_warning` is based on dependabot notices and is for scenarios such as when the package manager is outdated and Dependabot would stop supporting it.
  There are other scenarios when notices are generated.

### Patch Changes

- ff9570c: Prevent ReDoS vulnerabilities in regex patterns

  - Replace unsafe regex quantifiers in branch name normalization with safe string operations using split/filter/join
  - Replace regex-based placeholder extraction with bounded quantifiers and non-global matching to prevent exponential backtracking
  - Eliminates potential denial of service attacks from maliciously crafted input strings with consecutive special characters

- 538ddb9: Improve Azure DevOps file change handling for Dependabot updates
  - Skip no-op changes and avoid sending bodies for delete operations when pushing PR commits
  - Treat missing content and encoding as optional through the request models and builders
  - Tighten Dependabot dependency file schema with explicit operation and encoding enums

## 0.6.1

### Patch Changes

- c327af1: Fix content handling in pull request file changes and update schema to allow nullish content
- 539f3f1: Rely on simpler config for provenance (NPM_CONFIG_PROVENANCE=true)
- 48edd06: Enable package provenance

## 0.6.0

### Minor Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- b0a88f9: Bump dependabot-action from `3ae7b48` to `7f78151`.
  - Add support for `opentofu`
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251023141128 to v2.0.20251113195050
- bb6d72b: Make `DependabotJobConfig.id` required hence remove `jobId` from `DependabotJobBuilderOutput` and related references
- a6af8fd: Replace `generateKey(...)` with `Keygen` class to avoid conflicts with crypto method

### Patch Changes

- b6d749c: Import from `zod` instead of `zod/v4`
- 4dcf614: Add `bazel` to package ecosystems/managers, only allowed when `enable-beta-ecosystems` is set to `true`.

## 0.5.0

### Minor Changes

- 620e99e: Added detection of duplicate updates by ecosystem and directory/directories

### Patch Changes

- f343e74: Share utility for key generation
- 8c4f092: Handle organization URLs without trailing slashes.
  For example `https://dev.azure.com/contoso/` and `https://dev.azure.com/contoso` now result in the same organization.
- e6f2019: Require `cronjob` to be set when `interval` is set to `cron`

## 0.4.0

### Minor Changes

- 8041438: Migrate from deprecated GitHub `cvss` field to `cvssSeverities` with v4.0 support

  Updated GitHub Security Advisory client to use the new `cvssSeverities` API that provides both CVSS v3.1 and v4.0 scores, replacing the deprecated cvss field. The implementation prioritizes CVSS v4.0 when available for enhanced vulnerability scoring accuracy and future compatibility.

- 8041438: Use schema to validate response from GHSA hence update it to correct version
- 8c7637d: Make use of [`octokit-js`](https://github.com/octokit/octokit.js) instead of rolling own

### Patch Changes

- 8041438: Move to next package after logging vulnerabilities fetch failure

## 0.3.0

### Minor Changes

- e843b12: Rename url.url to url.value
- 3e9b4aa: No longer need browser exports

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation

## 0.2.0

### Minor Changes

- 89b166b: Support for pub-repository
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#pub-repository
- 2781941: Parsing and validation for multi-ecosystem updates
- 1f89855: Support for helm-registry
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#helm-registry
- 3d9f360: Support for cargo-registry
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#cargo-registry
- dd7764d: Support for goproxy-server
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#goproxy-server

### Patch Changes

- 245b38c: Warn missing schedules in updates; enforce requirement after 2025-Nov-30.
  This is to be closer to the official dependabot configuration options. The extensions and CLI do not use this but it may be used on the server based options.
- beedd5a: Update default experiments as of 23 October 2025
- 034e685: More flexibility parsing azure devops URLs for org, project, or repo
- b1e02d5: Bump dependabot-action from 6ec8998 to 497bdeb.
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251015175503 to v2.0.20251023141128.
  - Added julia
- 4c4e1a3: Support for rust-toolchain ecosystem/manager
  Official changelog: https://github.blog/changelog/2025-08-19-dependabot-now-supports-rust-toolchain-updates/
- c35a334: Support for vcpkg ecosystem/manager
  Official changelog: https://github.blog/changelog/2025-08-12-dependabot-version-updates-now-support-vcpkg/

## 0.1.0

### Minor Changes

- f8fc3fb: Split CLI package into focused modules

### Patch Changes

- 8798722: Generate browser target for core package where possible
