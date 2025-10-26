# Changelog

# Changelog

## 2025-10-24

- **BREAKING**: Added validation in `_applyTokensFilter()` to throw error if
  identifier is missing `tokens` field, ensuring bugs are caught early rather
  than silently allowing `NaN` comparisons

## 2025-10-18

- **BREAKING**: Added `IndexInterface` typedef defining minimal interface for
  index implementations
- **BREAKING**: Renamed `IndexBase.addItem()` to `add()` for consistency with
  interface
- **BREAKING**: Simplified `IndexBase.get()` to only accept array of IDs and
  always return array - signature is now `get(ids)` where ids is `string[]`
- **BREAKING**: Renamed `IndexBase.hasItem()` to `has()` for consistency with
  interface
- Added `@implements {IndexInterface}` JSDoc to `IndexBase` class

## 2025-10-19

- Bump version

## 2025-10-16

- Added `Retry` class for handling transient errors with exponential backoff and
  jitter
- Implemented support for retrying on 429 (Rate Limit), 502 (Bad Gateway), 503
  (Service Unavailable), and 504 (Gateway Timeout) status codes
- Added retry support for network connection errors (ECONNREFUSED, ECONNRESET,
  ETIMEDOUT)
- Configurable retry attempts (default: 10) and initial delay (default: 1000ms)
- Comprehensive test coverage for retry behavior in `test/retry.test.js`

## 2025-10-15

- Bump version

## 2025-10-14

- **REFACTOR**: Moved `getLatestUserMessage()` function to
  `@copilot-ld/libagent` as part of agent orchestration consolidation

## 2025-10-13

- Added `IndexBase` abstract class for shared index functionality across
  `VectorIndex` and `GraphIndex`
- Implemented shared filtering methods for prefix, limit, and token constraints
- Enhanced tokenizer with file extension suffix support and fixed length
  handling for empty/short inputs

## 2025-10-10

- Bump version
- **BREAKING**: Extracted code generation functionality to new
  `@copilot-ld/libcodegen` package
- Enhanced download/upload utilities with native TAR.gz extraction and improved
  cross-platform compatibility
- Added agent utility functions (`toMessages()`, `toTools()`) for LLM
  integration patterns local-to-remote storage synchronization
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

- **NEW**: Added `countTokens()` and `createTokenizer()` functions with
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
