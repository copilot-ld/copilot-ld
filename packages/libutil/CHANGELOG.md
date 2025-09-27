# Changelog

## 2025-09-27

- **NEW**: Added `DownloadInterface` and `Download` implementation for
  downloading and extracting `bundle.tar.gz` from remote storage
- **NEW**: Download utility specifically targets "generated" prefix in remote
  storage and extracts to local "generated" storage area
- **ENHANCED**: Extended `libutil` package with download capabilities using same
  dependency injection pattern as `Upload` class
- **NEW**: Added tar.gz extraction functionality using system `tar` command for
  portable bundle handling
- **NEW**: Added `download` CLI utility available via `npx download` for
  remote-to-local bundle synchronization

## 2025-09-27

- **NEW**: Added `UploadInterface` and `Upload` implementation for storage
  synchronization utilities with dependency injection pattern
- **NEW**: Added `upload` CLI utility available via `npx upload` for
  local-to-remote storage synchronization
- **MIGRATION**: Moved upload functionality from `scripts/upload.js` to reusable
  `@copilot-ld/libutil` package following established patterns
- **NEW**: Added bundle creation feature to codegen CLI - generates
  `bundle.tar.gz` archive of all generated directories
- **ENHANCED**: Improved codegen workflow with automatic archive creation for
  portable deployment packages

## 2025-09-26

- **BREAKING**: Completed migration of code generation system from
  `scripts/codegen.js` to reusable `@copilot-ld/libutil` package with
  object-oriented `Codegen` class and dependency injection
- **NEW**: Added `CodegenInterface` and `Codegen` implementation with logical
  method organization (high-level operations, mid-level functions, low-level
  utilities)
- **NEW**: Added `codegen` CLI utility available via `npx codegen` with
  `--target` path resolution supporting relative paths
- **NEW**: Added `resolveProjectRoot()` and `resolvePackagePath()` utilities for
  robust monorepo package resolution
- **ENHANCED**: Moved and improved mustache templates to
  `packages/libutil/templates/` with new `exports.js.mustache` for
  service/client aggregation

## 2025-09-19

- **NEW**: Added `countTokens()` and `tokenizerFactory()` functions with
  `js-tiktoken` dependency for consistent token counting
- Consolidated token counting functionality from `@copilot-ld/libcopilot` to
  provide centralized token management

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **SIMPLIFIED**: Removed unused `itemIndex` and `globalIndex` parameters from
  `processItem()` method in `ProcessorInterface` and `ProcessorBase`
- **NEW**: Added `ProcessorInterface` and `ProcessorBase` for unified batch
  processing with configurable batch sizes and progress tracking
- **NEW**: Initial implementation of centralized logging utilities with `Logger`
  class and `logFactory` function
- Extracted common patterns from `VectorProcessor` and `ResourceProcessor` to
  eliminate duplication
- Implemented `LoggerInterface` definition for type safety and consistency
  across the platform
