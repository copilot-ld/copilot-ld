# Changelog

## 2025-09-08

- **BREAKING**: Redesigned `VectorIndex` with Map-based storage for O(1)
  resource ID lookups and improved performance
- Enhanced dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added `getItem()` method for direct resource ID retrieval with optimized
  performance characteristics
- Updated to use URI-based keys with `cld:` format for consistent resource
  identification
- Integrated new `StorageInterface.append()` method for improved data
  persistence and management

## 2025-08-15

- Simplified error handling with improved text-based error messages
- Removed deprecated `getIndexPath()` method and associated tests for cleaner
  interface

## 2025-08-08

- Version bump
