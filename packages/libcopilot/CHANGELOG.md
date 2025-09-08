# Changelog

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
