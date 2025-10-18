# Changelog

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
