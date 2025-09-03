# Changelog

## 2025-09-02

- Switched `CompletionsRequest` to `repeated common.MessageV2 messages` and
  updated `CreateCompletions()` to process them, converting to simple
  `{role, content}` for backend calls

## 2025-09-01

- Updated `LlmService` to import from `./service.js` instead of `./types.js`
- Generated `LlmClient` class with automatic request/response type conversion

## 2025-08-28

## 2025-08-18

- Updated `CreateCompletions()` and `CreateEmbeddings()` methods to use single
  `req` parameter instead of destructured object parameters
- Changed method signatures from destructured objects to single parameter
  pattern
- Adjusted `CreateCompletions()` to destructure the single request object
  directly, keeping snake_case fields per service conventions.

## 2025-08-17

- Regenerated `base.js` to simplify parameter names/docs and disable
  `no-unused-vars` for stubs.
- Updated `CreateCompletions()`/`CreateEmbeddings()` signatures and docs to
  match service patterns.

## 2025-08-12

- Initial `LLM` service implementation
- Added `gRPC` service for language model operations
- Version `v1.0.0`
