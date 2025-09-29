# Changelog

## 2025-09-27

- **BREAKING**: Refactored `S3Storage` to use single bucket with prefixes
  instead of multiple buckets
- **ENHANCED**: Unified constructor parameters across `LocalStorage` and
  `S3Storage` for consistency
- **NEW**: Added `S3_BUCKET_NAME` environment variable configuration support
- **IMPROVED**: Simplified storage factory with better S3 bucket management and
  ability to test

## 2025-09-19

- Enhanced `#traverse()` methods in both `LocalStorage` and `S3Storage` to sort
  files by creation timestamp (oldest first) for consistent chronological
  ordering
- Added timestamp-based sorting to `list()`, `findByPrefix()`, and
  `findByExtension()` methods across both storage implementations
- Improved code organization with method grouping and consistent comment
  structure

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-15

- Fixed `S3Storage.put()` method to properly serialize JavaScript arrays back to
  JSONL format and objects to JSON format before uploading to S3
- Enhanced `LocalStorage.put()` method with same serialization logic for
  consistency
- Added `toJsonLines()` and `toJson()` helper functions for data serialization
- Added `isJsonLines()` and `isJson()` helper functions for format detection
- Resolved upload script errors when uploading parsed `.jsonl` files to S3
- Modified `#traverse()` methods in both `LocalStorage` and `S3Storage` to
  return files sorted by creation timestamp (oldest first) for consistent
  ordering
- Removed try/catch wrapper around `fs.stat()` calls to allow errors to surface
  more clearly rather than silently falling back to epoch time

## 2025-09-11

- **BREAKING**: Enhanced storage interface with automatic JSON/JSONL parsing and
  improved method naming (`find()` → `findByExtension()`)
- Added efficient data appending capabilities with `append()` method supporting
  both local and S3 storage
- Enhanced storage capabilities with `getMany()` for bulk retrieval,
  `findByPrefix()` for URI lookups, and `list()` for key enumeration
- Improved bucket management with `ensureBucket()` and `bucketExists()` methods
  for both storage implementations
- Consolidated file traversal logic with private helper methods for better
  maintainability
