---
"@paklo/core": minor
---

Add `update-types: string[]` field to the `DependabotAllowConditionSchema`, enabling `update-types` support in the `allow` block of `dependabot.yml`.

This matches the existing pattern in the `DependabotIgnoreConditionSchema` (ignore) schema which already has `update-types: string[]`.

Related:

- <https://github.com/dependabot/cli/pull/605>
- <https://github.com/dependabot/dependabot-core/pull/12925>
