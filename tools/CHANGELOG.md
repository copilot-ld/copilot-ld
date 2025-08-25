# Changelog

## 2025-08-25

- Deprecated the `chunk.js` tool
- Introduced a new `resources.js` tool that replaces `chunk.js`

## 2025-08-18

- Updated `service.js.mustache` template to use inline import type syntax in
  JSDoc comments instead of separate `@typedef` declarations for cleaner and
  more readable service method documentation

## 2025-08-18

- Hardened `codegen-services.js` field type normalization (handles numeric codes
  for `string`, `boolean`, and number types; resolves `MESSAGE`/`ENUM`)
- Template now ensures JSDoc `typedef` imports are emitted for custom
  message/enum field types (e.g., `Prompt`) so `@property { Prompt }` resolves
  to `common.Prompt` via `@copilot-ld/libtype`

## 2025-08-18

- Enhanced `codegen-services.js` and `service.js.mustache` to emit JSDoc
  `@typedef` import statements for all custom message/enum field types (e.g.,
  `Prompt`), ensuring generated service stubs include explicit type imports for
  referenced request fields

## 2025-08-18

- Fixed `tools/service.js.mustache` JSDoc `@typedef` block to be fully valid by
  naming the imported `{{requestType}}` and converting field annotations to
  `@property` entries, ensuring generated service stubs lint clean and provide
  accurate IDE type hints

## 2025-08-18

- Switched `codegen:proto` to use `protobufjs` via new `tools/proto-codegen.js`
- Generated `ESM` static modules into `generated/pbjs/*` with `.d.ts` via `pbts`
- Simplified `tools/codegen-services.js`: removed `jsDocBase`/`jsDocType` and
  now only emit `jsType`
- Extended `tools/service.js.mustache` to output separate `@typedef` statements
  per request field (e.g., `AgentRequest_sessionId`) using `jsType`

## 2025-08-17

- Streamlined service `codegen` to use typed Protobuf messages with centralized
  proto loading via `Service.loadProto()` and minimal stubs wrapped by
  `Service`.
- Cleaned and extracted templates (`tools/service.js.mustache`), removed
  underscore `params`, simplified `JSDoc`, and integrated consistent formatting.

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
