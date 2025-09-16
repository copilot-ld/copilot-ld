# Changelog

## 2025-09-16

- Bump version for public package publishing

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
