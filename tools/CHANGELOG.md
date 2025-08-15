# Changelog

## 2025-08-15

- Simplified `upload.js` tool by removing manual S3 client and bucket creation
  logic
- Updated `UploadTool` to use new `ensureBucket()` method from
  `StorageInterface` for bucket management
- Removed redundant `#ensureBucketExists()` method and `#s3Client` field from
  `UploadTool` class
- Enhanced error handling and logging consistency with centralized bucket
  management
- Reduced code complexity by 30+ lines while maintaining full functionality
- Tool now leverages consistent storage abstraction patterns across the platform

## 2025-08-15

- Completely rewrote `upload.js` tool to use `storageFactory()` pattern
- Upload tool now initializes local and S3 storage objects for each bucket
- Added special handling for config bucket (uploads only `config.yml` file)
- Standard buckets (`chunks`, `vectors`, `history`) upload all items using new
  `list()` method
- Simplified architecture using constructor dependency injection pattern

## 2025-08-12

- Initial tools package implementation
- Added command-line utilities for development and deployment
- Includes tools for certificates, chat, chunking, embeddings, and more
- Version `v1.0.0`
