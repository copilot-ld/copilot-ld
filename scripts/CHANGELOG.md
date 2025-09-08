# Changelog

## 2025-09-08

- **BREAKING**: Renamed directory from `tools/` to `scripts/` and updated
  package name to `@copilot-ld/scripts`
- Consolidated all code generation outputs into unified `generated/` directory
  structure
- Enhanced protobuf discovery with dynamic `.proto` file detection and
  deterministic ordering
- Updated dependency from `@copilot-ld/libservice` to `@copilot-ld/librpc`
- Improved template generation with better `JSDoc` type definitions and imports

## 2025-01-08

- Release scripting: enhanced `scripts/release-bump.js` with `--force`/`-f` to
  override existing `package.json` version; handles `package.json` differences;
  can appear anywhere; usage now documents `node scripts/release-bump.js`.
- Development workflow: refactored `scripts/dev.js` to reduce duplication,
  improved readability, and simplified `services` parameter handling; updated
  the main `package.json` to use "dev:restart" for combining stop/start
  commands.
- Code generation: introduced unified `scripts/codegen.js` with `--types`,
  `--services`, `--clients`, and `--all` flags for generating TypeScript types,
  service bases, and typed clients from protobuf definitions.
- Templates and docs: standardized `JSDoc` across `scripts/service.js.mustache`
  and `scripts/client.js.mustache` (consistent `gRPC` wording and typed
  parameter documentation).
- Token management: `scripts/token.js` now writes tokens to `config/.ghtoken`;
  updated Agent service to read tokens from file before falling back to
  environment variable.

## 2025-09-01

- Updated `chat.js` tool to use the new `AgentClient` class instead of generic
  `Client`
- Enhanced `chat.js` to use proper typed requests with `agent.AgentRequest` and
  `common.MessageV2`
- Improved message content handling in `chat.js` to support both string and
  object content structures
- Modified `codegen-services.js` to generate `service.js` and `service.d.ts`
  files instead of `types.js` and `types.d.ts`
- Added `codegen-clients.js` tool to generate typed client classes from protobuf
  definitions
- Added `client.js.mustache` template for generating client classes with
  automatic request/response type conversion using `fromObject()`
- Generated client classes extend `librpc` `Client` class and provide typed
  wrappers for all RPC methods

## 2025-08-28

- Enhanced `resources.js` tool with command-line argument parsing for
  `--selector` option
- Added new `dev.js` tool for managing development servers with `--start` and
  `--stop` options
- Updated main `package.json` to use `node tools/dev.js --start` for
  consolidated development workflow
- Removed unused `release-log.js` tool to simplify codebase
- Development servers now run in background with consolidated logging to
  `debug.log`

## 2025-08-26

- **BREAKING**: Migrated from legacy "indices" architecture to dual-index system
  for content and descriptor processing
- Updated `index.js` tool to process both content and descriptor representations
  using separate vector indexes
- Enhanced `search.js` and `cosine.js` tools to support `index_type` parameter
  for flexible index selection
- Modified `VectorProcessor` initialization to use distinct file names for
  `contentIndex` and `descriptorIndex`

## 2025-08-25

- **BREAKING**: Replaced `chunk.js` tool with new `resources.js` tool for
  improved resource management
- Updated `search.js` tool to use `ResourceIndex` instead of deprecated
  `ChunkIndex`
- Added `Policy` engine integration for access control in search operations
- Enhanced search results to display resource type information

## 2025-08-18

- Improved `codegen-services.js` field type normalization with better handling
  of numeric codes
- Updated `service.js.mustache` template to use inline import type syntax in
  `JSDoc` comments
- Enhanced template to ensure proper `JSDoc` `typedef` imports for custom
  message/enum field types to `common.Prompt` via `@copilot-ld/libtype`

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
