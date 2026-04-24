---
"@paklo/core": minor
---

Add multi-ecosystem execution planning and PR orchestration

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
