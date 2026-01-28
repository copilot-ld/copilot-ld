# Changelog

## 2026-01-28

- Migrated prompts from `steps/*-prompt.md` to `prompts/*.prompt.md`
- Updated `StepBase` to support optional `PromptLoader` injection
- Updated step classes to accept `PromptLoader` via constructor
- Updated `IngesterPipeline` to create and inject `PromptLoader`
- Added `@copilot-ld/libprompt` dependency

## 2025-12-01

- Initial release of `@copilot-ld/libingest` package
- Scans ingest in folder for files
- Moves each file to a new folder named by its SHA-256 hash
- Writes `context.json` with file name, extension, and mime type and ingest
  steps
