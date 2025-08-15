# Changelog

## 2025-08-15

- Refactored `LocalStorage` class to eliminate code duplication in directory
  traversal
- Added private `#traverse()` helper method to consolidate file traversal logic
  used by `find()` and `list()` methods
- Improved maintainability by reducing duplicate traversal code from 80+ lines
  to single reusable method
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
