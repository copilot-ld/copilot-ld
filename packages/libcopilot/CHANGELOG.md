# Changelog

## 2025-09-16

- Bump version again
- Bump version for public package publishing

## 2025-09-09

- **BREAKING CHANGE**: Updated `createCompletions()` method to use explicit
  parameters `(messages, tools, temperature, max_tokens)` instead of object
  parameter
- Implemented OpenAI-compatible API format conversions using clean object
  creation instead of `.toObject()` for better compatibility
- Enhanced message formatting to extract `content.text` and create clean OpenAI
  message objects with proper role/content structure
- Improved tool formatting to create clean OpenAI tool objects with proper
  type/function structure
- Added safety checks for null/undefined messages and proper content extraction
- Removed protobuf dependencies in favor of direct object mapping for more
  reliable conversion

## 2025-09-08

- Fixed critical bug in `#withRetry()` method where exhausted retry attempts
  with HTTP 429 errors would fall through without proper error handling
- Enhanced type safety with `llm.CompletionsResponse` objects and proper
  `common.Tool.fromObject()` conversions
- Improved message normalization converting `MessageV2` to standard format with
  `withIdentifier()` support
- Streamlined retry logic with reusable `#withRetry()` method applied to both
  completions and embeddings
- Updated default model configuration from `gpt-4o` to `gpt-4.1` for platform
  consistency

## 2025-08-12

- Initial `libcopilot` package implementation
- Added core copilot integration utilities
- Version `v1.0.0`
