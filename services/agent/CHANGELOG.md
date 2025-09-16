# Changelog

## 2025-09-16

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
