# Changelog

## 2025-08-18

- Updated `QueryItems()` method to use single `req` parameter instead of
  destructured object parameters
- Changed method signature from
  `QueryItems({ vector, threshold, limit, max_tokens })` to `QueryItems(req)`
- Changed `QueryItems()` to accept a single request object with snake_case
  fields (`vector`, `threshold`, `limit`, `max_tokens`).
- Updated token-management tests to call the new object-based `RPC` signature.

## 2025-08-17

- Regenerated `base.js` to simplify JSDoc and parameter names; added
  `no-unused-vars` directive.
- Updated `QueryItems()` signature and docs to follow project service patterns.

## 2025-08-08

- First build
- Version bump
- Version bump
- Version bump
