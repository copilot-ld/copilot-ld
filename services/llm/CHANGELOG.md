# Changelog

## 2025-09-09

- **BREAKING CHANGE**: Updated `createCompletions()` call to use explicit
  parameters and include `max_tokens` parameter

## 2025-09-08

- **BREAKING**: Switched to `repeated common.MessageV2 messages` in
  `CompletionsRequest` for improved message handling
- Updated default model configuration from `claude-3.5-sonnet` to `gpt-4o`
  across all configuration files
- Enhanced tool name derivation using `id.name.split('.')` for function calling
  compatibility
- Migrated to consolidated `generated/services/llm/` artifacts replacing legacy
  service files
- Streamlined method signatures to use single request parameter pattern with
  proper type conversion

## 2025-08-17

- Regenerated `base.js` to simplify parameter names/docs and disable
  `no-unused-vars` for stubs.
- Updated `CreateCompletions()`/`CreateEmbeddings()` signatures and docs to
  match service patterns.

## 2025-08-12

- Initial `LLM` service implementation
- Added `gRPC` service for language model operations
- Version `v1.0.0`
