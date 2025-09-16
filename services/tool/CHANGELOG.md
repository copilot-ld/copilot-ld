# Changelog

## 2025-09-16

- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **NEW**: Initial implementation of Tool service as part of Phase 3, Step 10
- **BREAKING**: Implemented strict type validation expecting `common.Tool` input
  objects with enhanced error handling
- Added gRPC proxy functionality with `ExecuteTool` and `ListTools` methods for
  dynamic tool routing
- Integrated configuration-driven endpoint mapping supporting both existing
  services and custom tool services
- Enhanced diagnostic logging with multi-stage tool name resolution and
  structural validation
