# Changelog

## 2025-10-13

- **BREAKING**: Simplified `MemoryService` constructor by removing
  `ResourceIndex` dependency
- **BREAKING**: Modified `GetWindow()` to return tools and history arrays
  instead of tools, context, and history
- Streamlined memory retrieval to focus on stored identifiers only, removing
  live resource prefix searches

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
- Implemented token budget filtering in `GetWindow()` method with configurable
  allocation parameters
- Added efficient JSON-ND storage format using `StorageInterface.append()` for
  memory persistence
- Enhanced memory window assembly with token-aware filtering for history, tasks,
  and context sections
- Migrated to consolidated `generated/services/memory/` artifacts replacing
  legacy service files
