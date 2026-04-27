# paklo

## 0.20.2

### Patch Changes

- Updated dependencies [[`42f3c3c`](https://github.com/mburumaxwell/paklo/commit/42f3c3ccc82a6d104abce31f775611634e6727c1), [`466b120`](https://github.com/mburumaxwell/paklo/commit/466b1201c4bd1c25ec8c961e15c30bebf86480a9), [`f718382`](https://github.com/mburumaxwell/paklo/commit/f7183823db740ffbb7c83112efc7ba04b9b44ad2), [`f1b3972`](https://github.com/mburumaxwell/paklo/commit/f1b397202c40f134a97259e1f78f79857432103f), [`489d13c`](https://github.com/mburumaxwell/paklo/commit/489d13c0bb0eb7ef2f4e038774f4e08a450921e4), [`48dc1ed`](https://github.com/mburumaxwell/paklo/commit/48dc1edb174906ecc7d92a453d764b021f233baf), [`b014671`](https://github.com/mburumaxwell/paklo/commit/b01467156fcafb5011b07aac9072c4bb820c1c7c), [`7805a85`](https://github.com/mburumaxwell/paklo/commit/7805a85544d3273020fab702fa3784e199daa03f)]:
  - @paklo/core@0.20.0

## 0.20.1

### Patch Changes

- Updated dependencies [[`03d4b4c`](https://github.com/mburumaxwell/paklo/commit/03d4b4ca243014d973191ee65ceb002bdb298fb5), [`a474cea`](https://github.com/mburumaxwell/paklo/commit/a474ceabe3887ec57f1117ba571ba00fe7f4fcdc), [`9274828`](https://github.com/mburumaxwell/paklo/commit/92748283cd7a68ac065044a1ab3cdd4de6522ab8), [`68ddd4e`](https://github.com/mburumaxwell/paklo/commit/68ddd4ea2f413fcaf1ce0b18fb37a9ac215c7c4c), [`425f1c8`](https://github.com/mburumaxwell/paklo/commit/425f1c85f1bd7c1317bf2c4a81fa25be009dfad6), [`a14908a`](https://github.com/mburumaxwell/paklo/commit/a14908a89d09554703b4240e4ecf03f90f857d70)]:
  - @paklo/core@0.19.0

## 0.20.0

### Minor Changes

- [`5527ff5`](https://github.com/mburumaxwell/paklo/commit/5527ff5d3d31124d12bbaf4f27c26edb26bc16cd) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Introduced better logger, not all logs are handled with pino.
  Defaults to console unless replaced. This helps us avoid exporting pino in places we should not and will allow later for using different logging tools in each area of tools.

- [`3ed6ba9`](https://github.com/mburumaxwell/paklo/commit/3ed6ba93ee68d7ef2e7f2cbe6478eb135b980c42) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Implement secret masker when running just the CLI

### Patch Changes

- [`13f507a`](https://github.com/mburumaxwell/paklo/commit/13f507a9ef3170953cb90cc5f7957ac5431f6175) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Add support for logging groups and sections.
  This used to be supported earlier but removed when we moved from `dependabot/cli` to our own CLI. This re-adds it.

- [`8052857`](https://github.com/mburumaxwell/paklo/commit/80528572578491931cf4f24010f9b3de2bd1497d) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Reorganize files for easier grouping and exports

- Updated dependencies [[`01ec8c7`](https://github.com/mburumaxwell/paklo/commit/01ec8c73408ac8593d46c76088e2384d01400851), [`5527ff5`](https://github.com/mburumaxwell/paklo/commit/5527ff5d3d31124d12bbaf4f27c26edb26bc16cd), [`13f507a`](https://github.com/mburumaxwell/paklo/commit/13f507a9ef3170953cb90cc5f7957ac5431f6175), [`8052857`](https://github.com/mburumaxwell/paklo/commit/80528572578491931cf4f24010f9b3de2bd1497d)]:
  - @paklo/core@0.18.0

## 0.19.1

### Patch Changes

- Updated dependencies [[`25d5095`](https://github.com/mburumaxwell/paklo/commit/25d5095158d953b00e24533d5cbdca7bf3c33669), [`67f1ff6`](https://github.com/mburumaxwell/paklo/commit/67f1ff6d52f24f6dc264570ee638432411f88bec)]:
  - @paklo/core@0.17.1

## 0.19.0

### Minor Changes

- [`0e57445`](https://github.com/mburumaxwell/paklo/commit/0e57445d1f4a2761188d1087b8d25f4a9bcc3326) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Merge runner package into core

- [`8dac66b`](https://github.com/mburumaxwell/paklo/commit/8dac66b09f4621c9b328dbdf9cff3805ad49d23c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Remove config export for azure from barrel export

### Patch Changes

- Updated dependencies [[`0e57445`](https://github.com/mburumaxwell/paklo/commit/0e57445d1f4a2761188d1087b8d25f4a9bcc3326), [`8dac66b`](https://github.com/mburumaxwell/paklo/commit/8dac66b09f4621c9b328dbdf9cff3805ad49d23c), [`0473f0a`](https://github.com/mburumaxwell/paklo/commit/0473f0a501f5025561224ae21310e3e1884ea331)]:
  - @paklo/core@0.17.0

## 0.18.9

### Patch Changes

- Updated dependencies [[`231805b`](https://github.com/mburumaxwell/paklo/commit/231805bfb306731f1991eedd69c1aa3f464c46f1), [`1874a27`](https://github.com/mburumaxwell/paklo/commit/1874a27d022cad745a0095c1a3b0c8296ac56cdf), [`7431349`](https://github.com/mburumaxwell/paklo/commit/743134945b0de6e641fcf632964f5beae14a5656)]:
  - @paklo/runner@0.13.0
  - @paklo/core@0.16.0

## 0.18.8

### Patch Changes

- Updated dependencies [[`d2b7fdc`](https://github.com/mburumaxwell/paklo/commit/d2b7fdc320684bcac8722bf42df5796f4d1d8272), [`772d6cd`](https://github.com/mburumaxwell/paklo/commit/772d6cd4aae828fc25b80188185989eab4dbfd1c), [`d92b912`](https://github.com/mburumaxwell/paklo/commit/d92b9124c494426832265b47c8bf7adc324e5d8b), [`1b7d1da`](https://github.com/mburumaxwell/paklo/commit/1b7d1da4d73b106e9b7667c9cb41df7b395fcd25), [`1f8a992`](https://github.com/mburumaxwell/paklo/commit/1f8a992a71aeb4276830349b2c1aa4713050b514), [`7810eed`](https://github.com/mburumaxwell/paklo/commit/7810eedad37f9e128a04e5336f0e9b431f973f57)]:
  - @paklo/core@0.15.0
  - @paklo/runner@0.12.4

## 0.18.7

### Patch Changes

- Updated dependencies [[`a7b1dd0`](https://github.com/mburumaxwell/paklo/commit/a7b1dd00a9c73679ae2cca077c383ce5aeb5a9e0), [`e56fdbe`](https://github.com/mburumaxwell/paklo/commit/e56fdbed8baceb22b73e21907fa23039cc5809d9)]:
  - @paklo/runner@0.12.3
  - @paklo/core@0.14.2

## 0.18.6

### Patch Changes

- Updated dependencies [[`37783c8`](https://github.com/mburumaxwell/paklo/commit/37783c8030664295325dbe09e853b2f64b52abaf), [`c7225aa`](https://github.com/mburumaxwell/paklo/commit/c7225aaa6cdea244053026331211660d88c380ad)]:
  - @paklo/runner@0.12.2

## 0.18.5

### Patch Changes

- Updated dependencies [[`71c0a73`](https://github.com/mburumaxwell/paklo/commit/71c0a734017886e1171c476988fdfe43b23b72b4), [`ca49611`](https://github.com/mburumaxwell/paklo/commit/ca49611770cf4c309df8d56e63695288a0f094e9), [`37391ba`](https://github.com/mburumaxwell/paklo/commit/37391badfe38f536a1f7a782f83acbc826ad49a4)]:
  - @paklo/runner@0.12.1
  - @paklo/core@0.14.1

## 0.18.4

### Patch Changes

- Updated dependencies [[`8e38517`](https://github.com/mburumaxwell/paklo/commit/8e38517b9e9fe1c529ad6076ba59c80720c297c7), [`bc6cf84`](https://github.com/mburumaxwell/paklo/commit/bc6cf84b31da25a8611b0309d2a366d13ccdd4ef), [`70351c4`](https://github.com/mburumaxwell/paklo/commit/70351c43f729b09d501c1d39fbc0795e4fe97bfd)]:
  - @paklo/runner@0.12.0
  - @paklo/core@0.14.0

## 0.18.3

### Patch Changes

- Updated dependencies [[`2c2bc29`](https://github.com/mburumaxwell/paklo/commit/2c2bc29b4b184b9d6ff951659e02563c61826959)]:
  - @paklo/runner@0.11.2

## 0.18.2

### Patch Changes

- Updated dependencies [[`c02b98c`](https://github.com/mburumaxwell/paklo/commit/c02b98c7e15465e15e36a7c8f3ec09cb586b4626), [`7c4a398`](https://github.com/mburumaxwell/paklo/commit/7c4a3983b2dee16918f345c0a62142a3eb0a511e)]:
  - @paklo/runner@0.11.1

## 0.18.1

### Patch Changes

- Updated dependencies [[`3660ce6`](https://github.com/mburumaxwell/paklo/commit/3660ce6b2d023cd8a6936ba41f28817b48d096e5), [`4b4d6e8`](https://github.com/mburumaxwell/paklo/commit/4b4d6e86e6e97ade624b4ccc636dddf4587ad9b7), [`d669060`](https://github.com/mburumaxwell/paklo/commit/d669060c931f3c99492683f07a974a2ea03406b9), [`e7f4e1b`](https://github.com/mburumaxwell/paklo/commit/e7f4e1b1d70e17088441ed9c9f3689baed05ecb9)]:
  - @paklo/runner@0.11.0

## 0.18.0

### Minor Changes

- [`942f6b0`](https://github.com/mburumaxwell/paklo/commit/942f6b0a4ad73ee32a8fed4dd64476e4f8a9fcf4) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update logic for dependabot commands, set default to update

- [#2472](https://github.com/mburumaxwell/paklo/pull/2472) [`e7ddb99`](https://github.com/mburumaxwell/paklo/commit/e7ddb996456b6b2758725a230f867c152f588ed0) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Change CLI commands to take repository URL directly with a provider hence allow for other providers

### Patch Changes

- Updated dependencies [[`942f6b0`](https://github.com/mburumaxwell/paklo/commit/942f6b0a4ad73ee32a8fed4dd64476e4f8a9fcf4), [`13e7685`](https://github.com/mburumaxwell/paklo/commit/13e7685f7807620fc1896a56e6cd495360bab807), [`5bb97c5`](https://github.com/mburumaxwell/paklo/commit/5bb97c509099d201a4a1e3e978016cf0330da237), [`6219b9f`](https://github.com/mburumaxwell/paklo/commit/6219b9f15c982dc8ff124cc0a9e81d54769533ec), [`e7ddb99`](https://github.com/mburumaxwell/paklo/commit/e7ddb996456b6b2758725a230f867c152f588ed0), [`bc56968`](https://github.com/mburumaxwell/paklo/commit/bc569687bdbe54234e08533069e62b38225c86fa)]:
  - @paklo/core@0.13.0
  - @paklo/runner@0.10.0

## 0.17.1

### Patch Changes

- Updated dependencies [[`e957487`](https://github.com/mburumaxwell/paklo/commit/e957487c31d148a217465276eca1284dc2764d39), [`8b8007d`](https://github.com/mburumaxwell/paklo/commit/8b8007d0f2ecb28c277432696df036ca064dd1e4), [`7ca8a5b`](https://github.com/mburumaxwell/paklo/commit/7ca8a5b87aaa1a15e6fc73ebeaef82d6b37c8ff9)]:
  - @paklo/core@0.12.1
  - @paklo/runner@0.9.1

## 0.17.0

### Minor Changes

- [#2404](https://github.com/mburumaxwell/paklo/pull/2404) [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Repository renamed to paklo

- [#2406](https://github.com/mburumaxwell/paklo/pull/2406) [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Updated documentation to catch up with months of changes

- [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Standard spelling for orgs (organization)
  Even though we should be using organisation, there are places we cannot change. Hence, we choose consistency.

### Patch Changes

- Updated dependencies [[`7c5ee09`](https://github.com/mburumaxwell/paklo/commit/7c5ee0967dc6c2759d860e5091f67fe9e95d0e17), [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13), [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14), [`e1302ef`](https://github.com/mburumaxwell/paklo/commit/e1302efc21a07b11aad2d8111bde051f15f9d4a7), [`79d860b`](https://github.com/mburumaxwell/paklo/commit/79d860bcc8a5d1cc3a8e4c0ffb9228be25986281), [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c), [`d96b059`](https://github.com/mburumaxwell/paklo/commit/d96b05982e5d1024d823cc21b12f3e0ce3ed4abf)]:
  - @paklo/runner@0.9.0
  - @paklo/core@0.12.0

## 0.16.3

### Patch Changes

- Updated dependencies [[`d2aa368`](https://github.com/mburumaxwell/paklo/commit/d2aa368588b40f7b774b7d3da9d054396455280b)]:
  - @paklo/runner@0.8.3

## 0.16.2

### Patch Changes

- Updated dependencies [[`f172ddf`](https://github.com/mburumaxwell/paklo/commit/f172ddffb28a8ebc4ad058f5bd411009eae3eb04), [`32705f9`](https://github.com/mburumaxwell/paklo/commit/32705f958be5e00f08028977967645e0f9370572), [`045c3fb`](https://github.com/mburumaxwell/paklo/commit/045c3fb1ece48904e4193b760ceb8e22a57609c7), [`26bcf23`](https://github.com/mburumaxwell/paklo/commit/26bcf23a6a7195c3ae9f5477222deb460a70091e), [`9ebdafd`](https://github.com/mburumaxwell/paklo/commit/9ebdafd43b5e87d04a06c4a16b6c4750455dace5)]:
  - @paklo/core@0.11.1
  - @paklo/runner@0.8.2

## 0.16.1

### Patch Changes

- Updated dependencies [dd14205]
- Updated dependencies [c55d8d1]
  - @paklo/core@0.11.0
  - @paklo/runner@0.8.1

## 0.16.0

### Minor Changes

- 8d56957: Changes (renaming and moving things around) to support features in the hosted version

### Patch Changes

- Updated dependencies [a45dfdf]
- Updated dependencies [3eb60b8]
- Updated dependencies [a28b3cf]
- Updated dependencies [8d56957]
- Updated dependencies [d2fea4e]
- Updated dependencies [8679f32]
  - @paklo/runner@0.8.0
  - @paklo/core@0.10.0

## 0.15.0

### Minor Changes

- e9b5d09: Rectify merge strategy options available

### Patch Changes

- Updated dependencies [e9b5d09]
- Updated dependencies [9a4f3ea]
- Updated dependencies [0fe301e]
- Updated dependencies [e9d5ad2]
- Updated dependencies [128bd4e]
- Updated dependencies [abf1f0e]
- Updated dependencies [e9b5d09]
- Updated dependencies [e9b5d09]
  - @paklo/core@0.9.0
  - @paklo/runner@0.7.0

## 0.14.0

### Minor Changes

- f279661: Require schedule to be present in the updates configuration.
  Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
  This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.

### Patch Changes

- Updated dependencies [985700f]
- Updated dependencies [f279661]
- Updated dependencies [34acb19]
- Updated dependencies [326ec5f]
  - @paklo/core@0.8.0
  - @paklo/runner@0.6.0

## 0.13.0

### Minor Changes

- 96d4898: Add verbosity option for dynamic logger level adjustment
- 7e4c4bd: Add cutoff option to cleanup command for customizable duration

### Patch Changes

- 45e8456: Refactor logger implementation to support customizable options and multiple output streams
- Updated dependencies [59c83f7]
- Updated dependencies [b6ca368]
- Updated dependencies [d315af2]
- Updated dependencies [45e8456]
- Updated dependencies [b201dae]
  - @paklo/runner@0.5.0
  - @paklo/core@0.7.3

## 0.12.2

### Patch Changes

- Updated dependencies [c5fb405]
- Updated dependencies [903ca2c]
  - @paklo/core@0.7.2
  - @paklo/runner@0.4.2

## 0.12.1

### Patch Changes

- Updated dependencies [5e16a01]
- Updated dependencies [f6e7cd9]
- Updated dependencies [434bc91]
- Updated dependencies [d79af62]
  - @paklo/runner@0.4.1
  - @paklo/core@0.7.1

## 0.12.0

### Minor Changes

- 3fcaa18: Add request inspection support for troubleshooting.
  - CLI `run` command can write raw Dependabot requests with `--inspect`, writing JSON snapshots under `./inspections`.
  - Core server accepts an optional inspect hook that records the raw request payload before processing.
- a03803e: Add `fetch-images` command

### Patch Changes

- Updated dependencies [ff9570c]
- Updated dependencies [5402afc]
- Updated dependencies [578e49b]
- Updated dependencies [b24a07a]
- Updated dependencies [3fcaa18]
- Updated dependencies [538ddb9]
- Updated dependencies [d999288]
- Updated dependencies [48615d6]
- Updated dependencies [80e7937]
  - @paklo/core@0.7.0
  - @paklo/runner@0.4.0

## 0.11.7

### Patch Changes

- 539f3f1: Rely on simpler config for provenance (NPM_CONFIG_PROVENANCE=true)
- 48edd06: Enable package provenance
- Updated dependencies [c327af1]
- Updated dependencies [539f3f1]
- Updated dependencies [48edd06]
  - @paklo/core@0.6.1
  - @paklo/runner@0.3.1

## 0.11.6

### Patch Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- b6d749c: Import from `zod` instead of `zod/v4`
- Updated dependencies [3dd9d68]
- Updated dependencies [b0a88f9]
- Updated dependencies [b6d749c]
- Updated dependencies [bb6d72b]
- Updated dependencies [4dcf614]
- Updated dependencies [a6af8fd]
  - @paklo/runner@0.3.0
  - @paklo/core@0.6.0

## 0.11.5

### Patch Changes

- Updated dependencies [f343e74]
- Updated dependencies [8c4f092]
- Updated dependencies [620e99e]
- Updated dependencies [e6f2019]
  - @paklo/runner@0.2.3
  - @paklo/core@0.5.0

## 0.11.4

### Patch Changes

- Updated dependencies [99d52cb]
  - @paklo/runner@0.2.2

## 0.11.3

### Patch Changes

- Updated dependencies [8041438]
- Updated dependencies [8041438]
- Updated dependencies [8c7637d]
- Updated dependencies [8041438]
  - @paklo/core@0.4.0
  - @paklo/runner@0.2.1

## 0.11.2

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation
- fc95c84: Add `executableFiles` to cli package so that they get `chmod+x` automatically
- 86eadbf: No longer hoisting packages
- Updated dependencies [9042c4b]
- Updated dependencies [e843b12]
- Updated dependencies [3e9b4aa]
  - @paklo/runner@0.2.0
  - @paklo/core@0.3.0

## 0.11.1

### Patch Changes

- 034e685: More flexibility parsing azure devops URLs for org, project, or repo
- Updated dependencies [245b38c]
- Updated dependencies [beedd5a]
- Updated dependencies [89b166b]
- Updated dependencies [2781941]
- Updated dependencies [034e685]
- Updated dependencies [b1e02d5]
- Updated dependencies [1f89855]
- Updated dependencies [3d9f360]
- Updated dependencies [dd7764d]
- Updated dependencies [4c4e1a3]
- Updated dependencies [c35a334]
  - @paklo/runner@0.1.1
  - @paklo/core@0.2.0

## 0.11.0

### Minor Changes

- f8fc3fb: Split CLI package into focused modules

### Patch Changes

- 1118859: Include project in usage telemetry
- Updated dependencies [f8fc3fb]
- Updated dependencies [8798722]
  - @paklo/core@0.1.0
  - @paklo/runner@0.1.0

## 0.10.1

### Patch Changes

- 5523b63: Bump dependabot-action from c8de751 to 6ec8998.
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251014173146 to v2.0.20251015175503
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251010195543 to v2.0.20251014173146
  - allow tenant-id and client-id in api information
- 14374e1: Bump dependabot-action from ddc330d to c8de751
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20250826205840 to v2.0.20251003180402
  - Pass OIDC environment variables to proxy

## 0.10.0

### Minor Changes

- 4c7e4f7: Add tool usage tracking.
  The information collected is shown in the logs at the end of each job.

  This is to help me understand the usage of the tool/extension/cli through a couple of weeks. There is no other source of this information except for when reviews are left but no-one is bothered to leave those or to even want to give feedback via other channels.
  Do people still use this? Let's find out.

## 0.9.0

### Minor Changes

- 755c770: Migrate to CJS+ESM to ESM-only
- 414b12d: Update [dependabot-action](https://github.com/github/dependabot-action) from `6b07cf6` to `ddc330d` which updates container images version and adds support for invocation of specific commands (graph)
- 93e4044: Migrate from tsup to tsdown
- 1c9b484: Restore order of finding dependabot config to remote first

### Patch Changes

- f489125: Use dynamic port for API server to avoid conflicts on busy hosts
- 6367fe1: Update default experiments as of 24 September 2025

## 0.8.3

### Patch Changes

- fd123bc: Fix Docker host resolution for API URLs and add extra hosts for Linux compatibility
- 8162cb8: Remove `dependabotApiLocalUrl` instead manipulate `dependabotApiUrl`
- 776d6ef: Do not allow glob patterns in update.directory

## 0.8.2

### Patch Changes

- cb0dabc: Add support for macOS by disabling WriteXorExecute for .NET updates on Apple Silicon
- 4dda9b7: Add missing updaterImage to job execution calls
- 565a4b7: Make `rootDir` optional when calling `getDependabotConfig` but default to current process directory

## 0.8.1

### Patch Changes

- 6965069: Set security vulnerabilities also when not updating a specific PR
- fd21a8e: Make 'commit-message-options' required in DependabotJobConfigSchema and default to null members when mapping
- 14516ac: Make 'dependency-name' required in DependabotConditionSchema and default to wildcard when mapping

## 0.8.0

### Minor Changes

- df23ea4: Change repository argument into required option
- f8842b3: Change project argument into required option
- 477100c: Change organisation-url argument into required option

## 0.7.0

### Minor Changes

- 464b287: Add support for running with Docker directly instead of through dependabot-cli
- 6eedcd0: Add support for cleaning up old images, containers or networks
- 98b0674: Update job config schema to make certain fields required. The dependabot-cli used to fill this automatically but without it, we need to add them
- 47549f4: Add jobs runner that contains most logic from run command
- e552f59: Replace axios with inbuilt fetch
- b8c85fd: Allow selection of target update ids in the CLI
- 81eed7e: Replicate output processor functionality into a local server bridging Azure DevOps and dependabot
- 50ab5c7: Skip authentication of job token if the request is HTTP because the proxy will have omitted it
- 544fca1: Convert extension task to no longer use dependabot CLI
- 5fe3503: Support security only updates in CLI
- 16b1cb6: Added ApiClient which sits in between the runner and the API
  This gets the CLI and shared package at par with github/dependabot-action clearing the way for migrating the v2 task and for managed runs later.
- 058603b: Replace azure-devops-node-api with native fetch calls
- 99dd824: Change job id values to be numbers generated randomly by default
- c63f3ee: Refactor authentication to be job specific even though we use the same token for all jobs in the CLI

### Patch Changes

- 566068d: Give the server a second to startup
- 48ed65e: Remove logging using `azure-pipelines-task-lib` in shared package
- 2a09c52: Change job token generation to crypto random
- 076178d: Find values for replacing tokens from the environment variables too
- 3790eee: Add --job-token option for easier life during testing
- 9ef5de7: Server should listen to all interfaces for local/host server

## 0.6.0

### Minor Changes

- 93b046c: Merge generate CLI command into run with a new `-generate-only` option
- fe8db3f: Add hono server to handle requests from API
- f622323: Move azure devops client logic to shared package

### Patch Changes

- 020075a: Move fetching of dependabot config to shared package

## 0.5.0

### Minor Changes

- bda2624: Added basic run command to CLI

### Patch Changes

- e4ce93e: Generate job token and set in ENV for future use

## 0.4.1

### Patch Changes

- 0be3fba: Update default experiments as of 04 August 2025

## 0.4.0

### Minor Changes

- 131d0f1: Added command to CLI to generate dependabot job files

### Patch Changes

- 4f9929b: Update default experiments as of 16 June 2025
- a257919: Update default experiments as of 02 July 2025

## 0.3.0

### Minor Changes

- 5af507a: Added CLI with command to validate a dependabot configuration file

### Patch Changes

- 86822e2: Fix invalid yaml references

## 0.2.0

### Minor Changes

- aaf6698: Complete enforcing of strict typescript

## 0.1.3

### Patch Changes

- 765bd89: pr-title and comimt-message are often omitted in update_pull_request

## 0.1.2

### Patch Changes

- 47b79b3: Script typing improvements

## 0.1.1

### Patch Changes

- 981fb6a: Replace ||= with ??= to preserve falsy values in default assignment
- 57a09c2: Coerce parsing of updated-at in ignore-conditions

## 0.1.0

### Minor Changes

- e6c0ffa: Added a new core package which stores some logic to be shared by extensions, dashboard, and servers with validation of config via zod
- 8985a46: Add schemas for input and output hence validate scenarios

### Patch Changes

- 1036cdf: Update default experiments as of 09 June 2025
- eb5edee: Pass `enable-beta-ecosystems` to the job config
- 5301c73: Set `multi-ecosystem-update` in job config
