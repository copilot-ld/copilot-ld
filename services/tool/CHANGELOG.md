# Changelog

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
