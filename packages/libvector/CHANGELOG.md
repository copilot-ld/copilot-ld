# Changelog

## 2025-12-02

- Fixed `VectorIndex.queryItems()` duplicate results when querying with multiple
  vectors - now deduplicates by keeping highest score per identifier

## 2025-11-30

- Added `tool.ToolFunction` to exclusion filter in `VectorProcessor` - tool
  definitions are no longer embedded since dynamic tool discovery is not used

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Added `exports` field to `package.json` to properly expose `index/vector.js`
  path for Docker container module resolution

## 2025-11-18

- Bump version

## 2025-10-24

- **Fixed**: Token filtering in vector queries by ensuring identifiers include
  `tokens` field for proper budget enforcement
- **REFACTOR**: Migrated from `@copilot-ld/libutil` to `@copilot-ld/libindex`
  for `IndexBase` functionality

## 2025-10-21

- **BREAKING**: Renamed `VectorIndex.addItem()` to `add()` for consistency with
  `IndexInterface`

## 2025-10-18

- Moved `vectors.js` to `bin/vectors.js` for `npx` execution and added required
  dependencies

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Standardized `addItem()` method signature to accept identifier
  first, then vector for consistency with `IndexBase`

## 2025-10-13

- **BREAKING**: Redesigned `VectorIndex` with Map-based storage and enhanced
  performance through `IndexBase` integration
- Enhanced `VectorProcessor` with unified batch processing and improved
  dual-index architecture
