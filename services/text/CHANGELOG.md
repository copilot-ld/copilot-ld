# Changelog

## 2025-08-18

- Updated `GetChunks()` method to use single `req` parameter instead of
  destructured object parameters
- Changed method signature from `GetChunks({ ids })` to `GetChunks(req)`

## 2025-08-17

- Regenerated `base.js` to simplify parameter names and `JSDoc`; disabled
  `no-unused-vars` for stubs.
- Updated `GetChunks()` signature/docs to match service conventions.

## 2025-08-12

- Initial `Text` service implementation
- Added `gRPC` service for text processing operations
- Version `v1.0.0`
