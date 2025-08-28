# Changelog

## 2025-08-28

- Enhanced `VectorIndex` to use new `StorageInterface.append()` method for
  improved data management
- Fixed all test failures by updating to use `resource.Identifier` objects with
  proper `type` and `name` properties
- Simplified `VectorProcessor` by removing redundant magnitude calculations and
  improving logging
- Updated `queryItems` method to use new filter object syntax for better query
  control

## 2025-08-26

- Implemented dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added configurable `indexKey` parameter to `VectorIndex` constructor for
  flexible index file management
- Enhanced `VectorProcessor` to automatically select appropriate index based on
  representation type

## 2025-08-15

- Simplified error handling with improved text-based error messages
- Removed deprecated `getIndexPath()` method and associated tests for cleaner
  interface

## 2025-08-08

- Version bump
