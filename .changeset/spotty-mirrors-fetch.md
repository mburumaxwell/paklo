---
"extension-azure-devops": minor
"@paklo/core": minor
"@paklo/cli": minor
---

Fetch & extract metadata from pull requests
This logic is partly borrowed from https://github.com/dependabot/fetch-metadata. The intention is to allow automation in a pipeline for a PR such as adding a changeset when a update PR needs one (example is in this repository's workflows), setting auto approve, setting auto complete, extra labelling, etc.
The logic for storing metadata already exists. This exposes fetch & extract using a new CLI command and a new Azure Pipelines Task
