# Changelog

## 2025-08-28

- Added `append()` method to `StorageInterface` for `URI-based` data appending
- Implemented efficient append operations in both `LocalStorage` (native file
  append) and `S3Storage` (read-modify-write)
- **BREAKING**: Renamed `StorageInterface.find()` to
  `StorageInterface.findByExtension()` for improved clarity
- Enhanced storage capabilities with `getMany()` method for bulk retrieval and
  `findByPrefix()` for optimized URI lookups
- Added comprehensive unit tests for all new storage methods

## 2025-08-15

- Refactored `LocalStorage` class to eliminate code duplication with private
  `#traverse()` helper method
- Improved maintainability by consolidating file traversal logic for `find()`
  and `list()` methods to single reusable method
- Added `ensureBucket()` method to `StorageInterface` for ensuring storage
  buckets exist
- Added `bucketExists()` method to `StorageInterface` for checking if storage
  buckets exist
- Enhanced `LocalStorage` implementation with bucket management for directory
  creation and validation
- Enhanced `S3Storage` implementation with bucket management using
  `CreateBucketCommand` and `HeadBucketCommand`
- Updated `storageFactory` to include new S3 commands for bucket management
  operations
- Added comprehensive unit tests for bucket management methods in both storage
  implementations

## 2025-08-15

- Added `list()` method to `StorageInterface` to list all keys in storage
- Implemented `list()` method in both `LocalStorage` and `S3Storage` classes
- **BREAKING**: Renamed private `#getKey()` method to public `path()` method in
  `LocalStorage` and `S3Storage` classes
- Added `path()` method to `StorageInterface` with proper JSDoc documentation
- The `path()` method is now part of the public API and can be used by consumers
  to get full paths

## 2025-08-12

- Removed `PromptStorage` class (moved to `@copilot-ld/libprompt` package)
- Cleaned up storage interface to focus on core storage implementations
