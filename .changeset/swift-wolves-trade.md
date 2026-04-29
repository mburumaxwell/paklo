---
"@paklo/core": patch
"@paklo/cli": patch
---

Restrict `--cutoff` to Go duration units supported by Docker (`ns`, `us`, `ms`, `s`, `m`, `h`).
Previously the schema allowed `d`, `w`, and `y` which Docker's `until` filter does not accept, causing a 500 error at runtime.
