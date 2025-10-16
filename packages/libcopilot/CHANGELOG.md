# Changelog

## 2025-10-16

- Refactored retry logic into reusable `Retry` class in `@copilot-ld/libutil`
- Updated `Copilot` class to use injected `Retry` dependency for better
  testability
- Moved retry tests to `@copilot-ld/libutil/test/retry.test.js`
- Enhanced retry logic to handle transient server errors (502 Bad Gateway, 503
  Service Unavailable, 504 Gateway Timeout)
- Added retry support for network connection errors (ECONNREFUSED, ECONNRESET,
  ETIMEDOUT)
- Increased maximum retry attempts from 5 to 10 for better resilience during
  heavy data processing
- Added jitter to exponential backoff to prevent thundering herd problem
- Added comprehensive test coverage for all retry scenarios

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

- **BREAKING**: Updated `createCompletions()` to use explicit parameters instead
  of object parameter
- Enhanced OpenAI API compatibility with improved message and tool formatting

## 2025-09-08

- Fixed critical bug in `#withRetry()` method where exhausted retry attempts
  with HTTP 429 errors would fall through without proper error handling
- Enhanced type safety with `llm.CompletionsResponse` objects and proper
  `tool.ToolDefinition.fromObject()` conversions
- Improved message normalization converting `Message` to standard format with
  `withIdentifier()` support
- Streamlined retry logic with reusable `#withRetry()` method applied to both
  completions and embeddings
- Updated default model configuration from `gpt-4o` to `gpt-4.1` for platform
  consistency

## 2025-08-12

- Initial `libcopilot` package implementation
- Added core copilot integration utilities
- Version `v1.0.0`
