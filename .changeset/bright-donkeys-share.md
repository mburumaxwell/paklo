---
"@paklo/core": patch
---

Fix Azure DevOps Server custom-port handling.
This is done by preserving bare `hostname` and connectable `host`, then passing the port-aware host into Dependabot jobs.
