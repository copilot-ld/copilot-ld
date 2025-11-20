# Changelog

## 2025-11-19

- Bump version

## 2025-11-18

- Bump version

## 2025-10-29

- Added `resourceIndex` dependency to `ToolService` constructor for loading
  resources
- Implemented `#processQueryResults()` method to load resources from identifiers
  and convert to strings
- Tool service now processes `QueryResults` by loading resources and converting
  their content or descriptor representations to strings using built-in
  `.toString()` methods
- Updated tests to use correct `CallTool` method name and include
  `resourceIndex` dependency

## 2025-10-28

- Removed manual `this.debug()` calls from `Call()` method
- Observability now handled automatically by `@copilot-ld/librpc` `Observer`
- Service implementation focuses purely on business logic

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Renamed `ExecuteTool()` to `Call()` and improved message
  structure with `QueryResults`
- Enhanced GitHub token handling and streamlined service initialization
- Simplified service initialization using `createResourceIndex()` factory
  function

## 2025-10-10

- **BREAKING**: Updated imports to use `@copilot-ld/librpc` services pattern
- Integrated automatic generated code management and simplified service startup

## 2025-09-19

- Removed client re-exports from service implementations for cleaner separation
  of concerns
- Enhanced Dockerfile to use multi-stage build pattern with base image
  dependency and proper Node.js version

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **NEW**: Initial implementation of Tool service as part of Phase 3, Step 10
- **BREAKING**: Implemented strict type validation expecting
  `tool.ToolDefinition` input objects with enhanced error handling
- Added gRPC proxy functionality with `Call` and `ListTools` methods for dynamic
  tool routing
- Integrated configuration-driven endpoint mapping supporting both existing
  services and custom tool services
- Enhanced diagnostic logging with multi-stage tool name resolution and
  structural validation
