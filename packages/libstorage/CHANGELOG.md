# Changelog

## 2026-01-18

- Added `SupabaseStorage` class extending `S3Storage` with REST API bucket
  creation
- Added `supabase` storage type to `createStorage()` factory
- Added `isHealthy()` method to `S3Storage` for storage reachability checks
- Added `isHealthy()` override in `SupabaseStorage` that catches connection
  errors (returns `true` if endpoint responds, even if bucket doesn't exist)
- Added unified storage CLI (`bin/storage.js`) with `create-bucket`, `wait`,
  `upload`, `download`, and `list` commands
- **BREAKING**: Changed `#bucket` to `_bucket` (protected) for subclass access
- Added `@copilot-ld/libconfig` and `@copilot-ld/libtelemetry` dependencies
- Fixed `createStorage()` to always use local storage for `config` and
  `generated` prefixes regardless of `STORAGE_TYPE` setting
- **BREAKING**: Replaced `MINIO_ENDPOINT` with `AWS_ENDPOINT_URL` for S3
  endpoint configuration
- The standard AWS SDK variable `AWS_ENDPOINT_URL` now configures custom
  S3-compatible endpoints (MinIO, Supabase Storage, DigitalOcean Spaces, etc.)
- Fixed `SupabaseStorage.ensureBucket()` to handle Supabase's 400 status with
  embedded 409 statusCode in JSON body for duplicate bucket errors

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-19

- Bump version

## 2025-10-18

- Fixed missing dependency: Added `@copilot-ld/libutil` to `package.json`

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-10-07

- Updated test cases to use simplified resource URI format without `cld:` prefix
- Enhanced test coverage for prefix-based storage operations with direct
  identifier format

## 2025-10-03

- Simplified type definitions by replacing `StorageInterface` class with JSDoc
  `@typedef`

## 2025-09-30

- Updated to use standard `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
  environment variables
- Enhanced credential configuration with fallback to default AWS credential
  chain

## 2025-09-29

- Fixed GitHub Actions OIDC authentication by adding `roleSessionName` and
  `durationSeconds` to S3 configuration

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
