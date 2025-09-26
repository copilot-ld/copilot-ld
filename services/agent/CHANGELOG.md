# Changelog

## 2025-09-26

- Bump version
- **BREAKING**: Updated imports to use `@copilot-ld/librpc` services and clients
  instead of local `generated/` files
- **CONTAINERIZATION**: Simplified `Dockerfile` to use standalone
  `node:22-alpine` base with private `@copilot-ld` packages via `.npmrc`
- **IMPORTS**: Enhanced service implementation to use destructured imports:
  `const { AgentBase } = services;`

## 2025-09-19

- Removed client re-exports from service implementations for cleaner separation
  of concerns
- Updated imports to use generated client classes from `generated/services/`
  instead of package imports
- Enhanced Dockerfile to use multi-stage build pattern with base image
  dependency

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- Added `tool_call_id` field to `MessageV2` protobuf definition for proper tool
  result handling
- Updated `CompletionsRequest` creation to use `fromObject()` instead of
  constructor for proper deep initialization
- Enhanced tool message creation to include `tool_call_id` in `fromObject()`
  call rather than post-assignment
- Enhanced tool handling with typed `common.Tool[]` objects and improved type
  safety throughout pipeline
- Improved tool discovery with fallback strategy when no tools found in memory
  window
- **BREAKING**: Replaced `Text` service dependency with `ResourceIndex` for
  improved resource management
- Streamlined memory budget integration with token-based filtering for
  conversation history and context
- Updated to use consolidated `generated/services/agent/` artifacts replacing
  legacy service files

## 2025-08-18

- Updated `ProcessRequest()` method signature to use single `req` parameter with
  snake_case fields
- Improved alignment with new `base.js` handler for consistent API structure

## 2025-08-17

- Simplified generated `base.js` with centralized auth/error handling in
  `Service`
- Updated `ProcessRequest()` signature and streamlined `JSDoc` documentation for
  fields
