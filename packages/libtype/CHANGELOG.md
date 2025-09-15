# Changelog

## 2025-09-11

- Consolidated all generated protobuf types into unified `generated/types/`
  directory structure
- **BREAKING**: Modified `llm.CompletionsRequest` to use
  `repeated common.MessageV2 messages` instead of `common.Prompt prompt`
- Enhanced `withIdentifier()` method to properly handle `null`/`undefined`
  parent values
- Restored direct monkey patching approach for imported types from
  `generated/types/types.js`
- Added `common.Prompt.prototype.fromMessages()` method for reconstructing
  prompts from message arrays

## 2025-01-24

- Added exports for all generated protobuf schemas from `generated/` directory

## 2025-08-12

- Initial `libtype` package implementation
- Added type definitions and object utilities
- Version `v1.0.0`
