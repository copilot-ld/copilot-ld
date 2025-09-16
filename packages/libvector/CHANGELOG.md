# Changelog

## 2025-09-16

- Bump version for public package publishing

## 2025-09-11

- **SIMPLIFIED**: Updated `VectorProcessor.processItem()` to remove unused
  `itemIndex` and `globalIndex` parameters
- **REFACTOR**: `VectorProcessor` now extends `ProcessorBase` from
  `@copilot-ld/libutil` for unified batch processing
- **BREAKING**: Redesigned `VectorIndex` with Map-based storage for O(1)
  resource ID lookups and improved performance
- Enhanced dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added `getItem()` method for direct resource ID retrieval with optimized
  performance characteristics

## 2025-08-15

- Simplified error handling with improved text-based error messages
- Removed deprecated `getIndexPath()` method and associated tests for cleaner
  interface

## 2025-08-08

- Version bump
