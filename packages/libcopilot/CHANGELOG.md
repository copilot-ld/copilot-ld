# Changelog

## 2025-09-02

- Normalized Copilot requests: convert `MessageV2` to `{role, content}`, add
  `max_tokens` default, and ensure returned messages are proper `MessageV2` with
  `withIdentifier()`
- Adopted `libtype` content conversion for robust handling of complex message
  content structures

## 2025-08-29

## 2025-08-28

- Refactored retry logic in `Copilot` class into reusable `#withRetry()` method
- Applied retry logic to both `createCompletions()` and `createEmbeddings()`
  methods
- Added `_setTestDelay()` method for configurable delays in testing
- Optimized test suite performance by using minimal delays for retry tests
- Enhanced test coverage for retry behavior across both API methods

## 2025-08-12

- Initial `libcopilot` package implementation
- Added core copilot integration utilities
- Version `v1.0.0`
