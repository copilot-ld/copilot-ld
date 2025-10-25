# Changelog

## 2025-10-24

- **REFACTOR**: Migrated from `@copilot-ld/libutil` to `@copilot-ld/libindex`
  for `IndexBase` functionality
- Moved `@copilot-ld/libutil` to `devDependencies` (only used by CLI tools and
  offline processor, not needed for runtime library code)

## 2025-10-21

- **BREAKING**: Renamed `VectorIndex.addItem()` to `add()` for consistency with
  `IndexInterface`
- Added `@implements {IndexInterface}` JSDoc to `VectorIndex` class

## 2025-10-19

- Bump version

# Changelog

## 2025-10-24

- **Fixed**: Token filtering in vector queries now works correctly - identifiers
  now include `tokens` field when added to vector indexes, enabling proper token
  budget enforcement via `_applyTokensFilter()`

## 2025-10-18

- Moved `vectors.js` script from `scripts/` to `bin/vectors.js` as a binary
- Added `bin` field to `package.json` to expose `vectors` binary
- Updated script with shebang line and proper error handling
- Fixed missing dependency: Added `@copilot-ld/libutil` to `package.json`

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
