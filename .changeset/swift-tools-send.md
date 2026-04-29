---
"@paklo/core": minor
"@paklo/cli": patch
"extension-azure-devops": patch
---

Replace `version` with `tool` in usage telemetry. The `tool` field identifies the calling package and version (e.g. `extension-azure-devops@2.61.0`, `@paklo/cli@0.21.0`) and is now a required field in `RunJobOptions['usage']` and `AzureLocalJobsRunnerOptions`.
