# @paklo/core

## 0.24.3

### Patch Changes

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 34 updates ([#2817](https://github.com/mburumaxwell/paklo/pull/2817))

## 0.24.2

### Patch Changes

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 33 updates ([#2808](https://github.com/mburumaxwell/paklo/pull/2808))

## 0.24.1

### Patch Changes

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 34 updates ([#2780](https://github.com/mburumaxwell/paklo/pull/2780))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 34 updates ([#2791](https://github.com/mburumaxwell/paklo/pull/2791))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 33 updates ([#2802](https://github.com/mburumaxwell/paklo/pull/2802))

- Pass dependency-group to getPullRequestForDependencyNames in close_pull_request handler ([#2794](https://github.com/mburumaxwell/paklo/pull/2794))

## 0.24.0

### Minor Changes

- Add `update-types: string[]` field to the `DependabotAllowConditionSchema`, enabling `update-types` support in the `allow` block of `dependabot.yml`. ([`50f07a9`](https://github.com/mburumaxwell/paklo/commit/50f07a9a7fc63187677e45197f54a151cac0e147))

  This matches the existing pattern in the `DependabotIgnoreConditionSchema` (ignore) schema which already has `update-types: string[]`.

  Related:

  - <https://github.com/dependabot/cli/pull/605>
  - <https://github.com/dependabot/dependabot-core/pull/12925>

- `sbt` ecosystem no longer in beta ([`b36c9b3`](https://github.com/mburumaxwell/paklo/commit/b36c9b31c80f39bafb4340317f1ab6ce9f2b72ea))

  Changelog: <https://github.blog/changelog/2026-05-26-dependabot-version-updates-now-support-the-sbt-ecosystem/>

- `deno` ecosystem no longer in beta ([`2c6cd41`](https://github.com/mburumaxwell/paklo/commit/2c6cd416a1ebb6f19e627b986f61916206d7cf08))

  Ref: <https://github.com/dependabot/dependabot-core/pull/15173>

### Patch Changes

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 32 updates ([#2747](https://github.com/mburumaxwell/paklo/pull/2747))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 34 updates ([#2758](https://github.com/mburumaxwell/paklo/pull/2758))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 33 updates ([#2763](https://github.com/mburumaxwell/paklo/pull/2763))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 34 updates ([#2769](https://github.com/mburumaxwell/paklo/pull/2769))

- Set `NODE_OPTIONS` to increase V8 heap for large monorepos ([`5dd5cb1`](https://github.com/mburumaxwell/paklo/commit/5dd5cb1b223f3a072b8a6f5cde61f67cb1f008cb))
  The updater container has an 8GB memory limit (`UPDATER_MAX_MEMORY`), but Node.js V8 auto-scaling caps heap at ~2GB for containers above 4GB. This leaves ~6GB of allocated container memory unused while pnpm/npm crash with "JavaScript heap out of memory" on large monorepos (100+ workspace packages) during lockfile regeneration.

  Set `NODE_OPTIONS=--max-old-space-size=4096` to allow V8 to use up to 4GB (half the container limit), leaving room for Ruby and other processes.

  Related:

  - <https://github.com/github/dependabot-action/commit/bbdee8a6bf002827e0828bdab7ab26773518f2bd>
  - <https://github.com/dependabot/dependabot-core/issues/14596>

- Use metadata from commit message footer but fallback to persisted props ([`886387f`](https://github.com/mburumaxwell/paklo/commit/886387f80b2e3c0f285c174c4d219645070309c3))

- Add `sbt` to package ecosystems/managers, only allowed when `enable-beta-ecosystems` is set to `true` ([#2748](https://github.com/mburumaxwell/paklo/pull/2748))

## 0.23.0

### Minor Changes

- Add footer to commit which contains metadata. ([`04857fc`](https://github.com/mburumaxwell/paklo/commit/04857fc08d8214a699ea10890cba0140718d3cca))
  While this was useful for parsing `dependency-type` that we use for metadata, it appears to not have been populated in the commits we made because the logic on GitHub hosted is private and adding it here, it may be useful for other sources.

- Fetch & extract metadata from pull requests ([#2730](https://github.com/mburumaxwell/paklo/pull/2730))
  This logic is partly borrowed from https://github.com/dependabot/fetch-metadata. The intention is to allow automation in a pipeline for a PR such as adding a changeset when a update PR needs one (example is in this repository's workflows), setting auto approve, setting auto complete, extra labelling, etc.
  The logic for storing metadata already exists. This exposes fetch & extract using a new CLI command and a new Azure Pipelines Task

- Parse first commit to get dependency-type for fetch metadata ([`9306679`](https://github.com/mburumaxwell/paklo/commit/930667957f539c8eb017fe2bfc2214f6ed3ecb60))

- Fetch compatibility score and use it when extracting metadata ([`12839b6`](https://github.com/mburumaxwell/paklo/commit/12839b6380578aeea17f1d1fa55209b7cc749618))

- Save vulnerability info (id and cvss) in commit metadata. ([`3c81e5c`](https://github.com/mburumaxwell/paklo/commit/3c81e5c7709f7d9a1a0f7da390ff47ad526d67f6))
  This is useful for visibility but more importantly for it to be parsed appropriately when fetching metadata

### Patch Changes

- Check first commit author instead of any commit when deciding whether to skip a pull request update ([`cf96673`](https://github.com/mburumaxwell/paklo/commit/cf966732cc09973aca7d537de0ab774e70052f52))

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 31 updates ([#2735](https://github.com/mburumaxwell/paklo/pull/2735))

- Add `deno` to package ecosystems/managers, only allowed when `enable-beta-ecosystems` is set to `true` ([`923b23a`](https://github.com/mburumaxwell/paklo/commit/923b23a02748acaaa8e3c9c05d770b5911977d20))

## 0.22.0

### Minor Changes

- Use version ranges for dependencies instead of exact pins, allowing package managers to deduplicate with consumer-installed versions. ([`3eb962e`](https://github.com/mburumaxwell/paklo/commit/3eb962e0f6625972019599d19f2eaa949eee70b6))

### Patch Changes

- Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 32 updates ([#2727](https://github.com/mburumaxwell/paklo/pull/2727))

- Rename `PackageManager*` types and constants to disambiguate them ([`1aaa529`](https://github.com/mburumaxwell/paklo/commit/1aaa529244f3e62ad1059f1d7ea778b00f361bbb))

## 0.21.0

### Minor Changes

- [`665cea9`](https://github.com/mburumaxwell/paklo/commit/665cea9791090aeeba9a1685367825c6856d645b) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Replace `version` with `tool` in usage telemetry. The `tool` field identifies the calling package and version (e.g. `extension-azure-devops@2.61.0`, `@paklo/cli@0.21.0`) and is now a required field in `RunJobOptions['usage']` and `AzureLocalJobsRunnerOptions`.

### Patch Changes

- [#2720](https://github.com/mburumaxwell/paklo/pull/2720) [`d05665b`](https://github.com/mburumaxwell/paklo/commit/d05665b98e3e4a98e80b2b1868ec68ff62726fb1) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Restrict `--cutoff` to Go duration units supported by Docker (`ns`, `us`, `ms`, `s`, `m`, `h`).
  Previously the schema allowed `d`, `w`, and `y` which Docker's `until` filter does not accept, causing a 500 error at runtime.

## 0.20.1

### Patch Changes

- [`c2bddc4`](https://github.com/mburumaxwell/paklo/commit/c2bddc431713c8f163b730cae3ce87afb1167a34) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Improve custom-port git authentication by adding a bare-host credential fallback when a credential host includes a non-default port.

## 0.20.0

### Minor Changes

- [`f718382`](https://github.com/mburumaxwell/paklo/commit/f7183823db740ffbb7c83112efc7ba04b9b44ad2) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Revert checking if a PR has been edited from considering all commits to just at least one.
  This reverts commit 425f1c85f1bd7c1317bf2c4a81fa25be009dfad6.

- [#2710](https://github.com/mburumaxwell/paklo/pull/2710) [`7805a85`](https://github.com/mburumaxwell/paklo/commit/7805a85544d3273020fab702fa3784e199daa03f) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add multi-ecosystem execution planning and PR orchestration

  Build on the initial multi-ecosystem config and job support by introducing
  execution-unit planning and orchestration for grouped updates.

  This change teaches the runner to plan linked updates together, defer
  multi-ecosystem PR creation until all member jobs have finished, and then
  finalize a single consolidated PR with a shared branch, combined body, and
  merged settings.

  It also adds PR metadata for the new flow, including explicit
  `Dependabot.PackageManagers` and `Dependabot.MultiEcosystemGroupName` properties,
  while keeping read compatibility for older PRs that only stored
  `Dependabot.PackageManager`.

### Patch Changes

- [`42f3c3c`](https://github.com/mburumaxwell/paklo/commit/42f3c3ccc82a6d104abce31f775611634e6727c1) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Use regenerated Dependabot commit messages for pull request refreshes when
  they are provided.
  Ref: https://github.com/dependabot/dependabot-core/pull/14808

- [#2709](https://github.com/mburumaxwell/paklo/pull/2709) [`466b120`](https://github.com/mburumaxwell/paklo/commit/466b1201c4bd1c25ec8c961e15c30bebf86480a9) Thanks [@dependabot](https://github.com/apps/dependabot)! - Updated docker container manifest for Bump the dependabot-core-images group across 1 directory with 32 updates

- [`f1b3972`](https://github.com/mburumaxwell/paklo/commit/f1b397202c40f134a97259e1f78f79857432103f) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Fix setting of groups for multi-ecosystem updates

- [#2711](https://github.com/mburumaxwell/paklo/pull/2711) [`489d13c`](https://github.com/mburumaxwell/paklo/commit/489d13c0bb0eb7ef2f4e038774f4e08a450921e4) Thanks [@sander102907](https://github.com/sander102907)! - Support security advisories from github when using uv as package ecosystem

- [`48dc1ed`](https://github.com/mburumaxwell/paklo/commit/48dc1edb174906ecc7d92a453d764b021f233baf) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Map `gradle` to `MAVEN`, `bun` to `NPM`, `dotnet_sdk` to `NUGET`, and `hex` to `ERLANG` when checking for security vulnerabilities

- [`b014671`](https://github.com/mburumaxwell/paklo/commit/b01467156fcafb5011b07aac9072c4bb820c1c7c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 22 April 2026

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
