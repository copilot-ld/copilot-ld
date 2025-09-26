# Changelog

## 2025-09-26

- **UPDATED**: Enhanced package exports to support new code generation system
- **IMPROVED**: Compatibility with `@copilot-ld/librpc` aggregated
  service/client imports
- **DEPENDENCIES**: Updated `package.json` for better integration with monorepo
  package resolution

## 2025-09-25

- **BREAKING**: Removed service and client exports from `@copilot-ld/libtype`
- Now exclusively contains protobuf type definitions and message structures
- Service bases and clients moved to `@copilot-ld/librpc` to prevent circular
  dependencies
- Generated code now located in `packages/libtype/generated/` instead of project
  root `generated/`
- Simplified package architecture with clean separation of concerns

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
