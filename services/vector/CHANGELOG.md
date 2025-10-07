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
  `const { VectorBase } = services;`

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

## 2025-09-11

- Enhanced dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added `GetItem` RPC method to retrieve individual items by resource ID with
  flexible index selection
- Updated `QueryItems()` method with improved filter parameters and token-aware
  processing
- Migrated to consolidated `generated/services/vector/` artifacts replacing
  legacy service files
- Streamlined test suite to support new dual-index approach with comprehensive
  validation

## 2025-08-17

- Regenerated `base.js` to simplify `JSDoc` and parameter names
- Updated `QueryItems()` signature and docs to follow project service patterns

## 2025-08-08

- Initial service implementation
