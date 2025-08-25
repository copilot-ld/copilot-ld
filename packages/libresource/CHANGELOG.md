# Changelog

## 2025-01-02

- Initial implementation of `ResourceIndex` class for typed resource management
- Added `ResourceProcessor` for chunking resource content
- Implemented universal resource identification system using URN format
- Added policy integration for access control

## 2025-08-25

- Added `getAll()` method to `ResourceIndexInterface` for retrieving all resources with policy filtering
- Implemented `getAll()` method in `ResourceIndex` class that calls `storage.list()` to get all IDs, then delegates to existing `get()` method for policy evaluation and data retrieval
