# Changelog

## 2025-01-24

- Refactored to re-export all classes and functions from `@copilot-ld/libtype`
  for backward compatibility
- Moved `Prompt`, `PromptAssembler`, `PromptOptimizer`, `PromptStorage` classes
  to `libtype` package
- Moved utility functions `generateSessionId()` and `getLatestUserMessage()` to
  `libtype` package
- Package now serves as a compatibility layer for existing imports

## 2025-08-12

- Removed `basePath` handling from `PromptStorage` constructor and methods
- `PromptStorage` now works directly with file names instead of
  `basepath`/filename combinations
- Simplified constructor to only require storage parameter
- Moved `PromptStorage` class from `libstorage` to `libprompt` package
- Added dependency on `@copilot-ld/libstorage` package
- Updated `PromptStorage` to use underscore property names for consistency with
  `Prompt` class
