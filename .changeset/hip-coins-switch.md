---
"extension-azure-devops": minor
"@paklo/core": minor
"@paklo/cli": minor
---

Introduced better logger, not all logs are handled with pino.
Defaults to console unless replaced. This helps us avoid exporting pino in places we should not and will allow later for using different logging tools in each area of tools.
