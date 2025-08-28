# Changelog

## 2025-08-28

- Enhanced dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added `index_type` parameter to `QueryItems()` method for flexible index
  selection
- Completely rewrote test suite to support new dual-index approach with
  comprehensive token filtering tests
- Updated `server.js` to initialize both content and descriptor vector indexes
  with separate file names

## 2025-08-18

- Updated `QueryItems()` method to use single `req` parameter with snake_case
  fields
- Improved alignment with project service patterns for consistent API structure

## 2025-08-17

- Regenerated `base.js` to simplify `JSDoc` and parameter names
- Updated `QueryItems()` signature and docs to follow project service patterns

## 2025-08-08

- Initial service implementation
