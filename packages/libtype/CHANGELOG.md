# Changelog

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced `withIdentifier()` method to support additional subject parameter for
  improved resource identification

## 2025-10-10

- Bump version

- **BREAKING**: Simplified Resource URI format by removing `cld:` namespace
  prefix from identifier methods
- Enhanced package architecture with clean separation of protobuf types from
  service/client code

## 2025-09-19

- Moved token counting functionality from `@copilot-ld/libcopilot` to
  `@copilot-ld/libutil` for better modularity
- Enhanced `common.Assistant.fromObject()` to apply default role of "system"
  when not specified
- Improved monkey-patch organization with cleaner constructor references

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- Consolidated all generated protobuf types into unified `generated/types/`
  directory structure
- **BREAKING**: Modified `llm.CompletionsRequest` to use
  `repeated common.Message messages` instead of `common.Prompt prompt`
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
