# Changelog

## 2026-01-15

- **BREAKING**: Renamed package from `@copilot-ld/libcopilot` to
  `@copilot-ld/libllm`
- **BREAKING**: Renamed `Copilot` class to `LlmApi` and `createLlm()` to
  `createLlmApi()`
- **BREAKING**: Added `baseUrl` parameter to support any OpenAI-compatible API
- Removed GitHub-specific `Copilot-Vision-Request` header

## 2025-11-30

- Fixed `tool_calls` format conversion to OpenAI API structure - removes
  internal `function.id` resource identifier

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Extracted tool description formatting logic into dedicated `formatter.js`
  helper file
- Created `formatToolDescription()` function for reusable tool description
  parsing and formatting

## 2025-11-17

- Fixed tool description formatting in `createCompletions()` to properly parse
  and format JSON-structured content fields
- Tool descriptions are now parsed from JSON format and formatted with clear
  sections (PURPOSE, WHEN TO USE, HOW TO USE, RETURNS)
- Ensures LLM receives properly formatted tool descriptions instead of raw JSON
  strings

## 2025-11-18

- Bump version
- Added HTTPS proxy support via `HTTPS_PROXY` environment variable
- Added `https-proxy-agent` dependency for proxy configuration
- Created `createProxyAwareFetch()` helper function to automatically configure
  proxy when `HTTPS_PROXY` or `https_proxy` environment variables are set
- Updated `createLlm()` factory to use proxy-aware fetch by default

## 2025-10-19

- Bump version

## 2025-10-16

- Refactored retry logic into reusable `Retry` class in `@copilot-ld/libutil`
- Updated `LlmApi` class to use injected `Retry` dependency for better
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

- Initial `libllm` package implementation (formerly `libcopilot`)
- Added core LLM integration utilities
- Version `v1.0.0`
