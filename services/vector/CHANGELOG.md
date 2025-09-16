# Changelog

## 2025-09-16

- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- Enhanced dual-index architecture with separate `contentIndex` and
  `descriptorIndex` support
- Added `GetItem` RPC method to retrieve individual items by resource ID with
  flexible index selection
- Updated `QueryItems()` method with improved filter parameters and token-aware
  processing
- Migrated to consolidated `generated/services/vector/` artifacts replacing
  legacy service files
- Streamlined test suite to support new dual-index approach with comprehensive
  validation

## 2025-08-17

- Regenerated `base.js` to simplify `JSDoc` and parameter names
- Updated `QueryItems()` signature and docs to follow project service patterns

## 2025-08-08

- Initial service implementation
