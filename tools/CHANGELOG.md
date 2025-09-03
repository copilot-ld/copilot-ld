# Changelog

## 2025-09-03

- Updated `tools/token.js` to write tokens directly to `config/.ghtoken` instead
  of the repo root, removing the need to manually move the file
- Updated `README.md` and `docs/getting-started.html` to reflect the new token
  location and simplified instructions

## 2025-09-03

- Updated `dev.js` `start()` to log once per service, mirroring `stop()` output
  - Prints `Starting \`@scope/name\`...` for newly launched services
  - Prints ``@scope/name`: already running`when a`PID` entry exists
  - Keeps consolidated log file at `data/dev.log`

## 2025-09-03

- Standardized JSDoc wording across `tools/service.js.mustache` and
  `tools/client.js.mustache`:
  - Consistent use of `gRPC` terminology in summaries and parameter docs
  - Unified phrasing for typed request/response (`Typed request message.` /
    `Typed response message.`)
  - Normalized punctuation and `backticks` around symbols and RPC method names

## 2025-09-03

- Added unified `codegen.js` tool supporting:
  - `node tools/codegen.js --types` to generate `@copilot-ld/libtype` types
  - `node tools/codegen.js --services` to generate service base classes
  - `node tools/codegen.js --clients` to generate typed clients
  - `node tools/codegen.js --all` to run all generators
- Consolidates duplicated logic from `codegen-types.js`, `codegen-services.js`,
  and `codegen-clients.js`
- Preserves output locations and behavior, including `pbjs/pbts` ESM fixes and
  `tsc`-based `.d.ts` generation

## 2025-09-03

- Refactored `dev.js` to reduce duplication and simplify control flow
  - Added small helpers (`readJson`, `writeJson`, `matchPattern`) to centralize
    IO and pattern building
  - Consolidated `CLI` dispatch via a `commands` map while preserving existing
    flags
  - Kept negative `PGID` semantics and signal handling (`SIGTERM` then
    `SIGKILL`) unchanged
  - Documented public functions with `JSDoc` to satisfy lint rules

## 2025-09-03

- Updated `dev.js` so `list()` uses the same process match patterns as
  `cleanup()` via shared `MATCH_PATTERNS`, ensuring consistent filtering of
  development processes

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
- Generated client classes extend `libservice` `Client` class and provide typed
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
