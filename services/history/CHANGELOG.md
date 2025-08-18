# Changelog

## 2025-08-18

- Updated `GetHistory()` and `UpdateHistory()` methods to use single `req`
  parameter instead of destructured object parameters
- Changed method signatures from destructured objects to single parameter
  pattern

## 2025-08-17

- Regenerated `base.js`; centralized auth/error handling in `Service` and
  simplified `JSDoc`/parameter names.
- Updated `GetHistory()`/`UpdateHistory()` signatures and docs to project
  conventions.

## 2025-08-12

- Fixed storage path resolution to use top-level `data/storage/history` instead
  of creating `services/history/data`
- Storage now correctly uses the shared storage location consistent with other
  services
