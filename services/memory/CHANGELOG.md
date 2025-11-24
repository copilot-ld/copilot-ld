# Changelog

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-28

- Removed manual `this.debug()` calls from `Append()` and `Get()` methods
- Observability now handled automatically by `@copilot-ld/librpc` `Observer`
- Service implementation focuses purely on business logic

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Updated `Get()` method to use allocation ratios (0-1) instead of
  absolute token counts
- Enhanced test coverage with complete storage interface mocks and proper
  protobuf object creation
- Updated budget allocation system to use ratio-based calculations
- Simplified service initialization using `createResourceIndex()` factory
  function

## 2025-10-13

- **REFACTOR**: Extracted business logic to framework-agnostic
  `@copilot-ld/libmemory` package
- Reduced service implementation by 36% while adding per-resource caching and
  improved performance
- **BREAKING**: Simplified API with renamed `GetWindow()` to `Get()` and
  streamlined response structure

## 2025-10-10

- **BREAKING**: Updated imports to use `@copilot-ld/librpc` services pattern
- Integrated automatic generated code management and simplified service startup

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

- **NEW**: Initial implementation of Memory service replacing legacy History
  service
- Implemented token budget filtering in `Get()` method with configurable
  allocation parameters
- Added efficient JSON-ND storage format using `StorageInterface.append()` for
  memory persistence
- Enhanced memory window assembly with token-aware filtering for history, tasks,
  and context sections
- Migrated to consolidated `generated/services/memory/` artifacts replacing
  legacy service files
