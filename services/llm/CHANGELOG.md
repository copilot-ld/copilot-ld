# Changelog

## 2025-10-07

- Simplified development workflow by removing `--env-file` flag from `dev`
  script

## 2025-10-03

- Integrated `downloadFactory()` from `@copilot-ld/libutil` for automatic
  generated code management
- Simplified service startup by removing Docker-specific code paths

## 2025-09-26

- Bump version
- **BREAKING**: Updated imports to use `@copilot-ld/librpc` services instead of
  local `generated/` files
- **CONTAINERIZATION**: Simplified `Dockerfile` to use standalone
  `node:22-alpine` base with private `@copilot-ld` packages via `.npmrc`
- **IMPORTS**: Enhanced service implementation to use destructured imports:
  `const { LlmBase } = services;`

## 2025-09-19

- Removed client re-exports from service implementations for cleaner separation
  of concerns
- Enhanced Dockerfile to use multi-stage build pattern with base image
  dependency

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

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
