# Changelog

## 2025-09-16

- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **NEW**: Initial implementation of Memory service replacing legacy History
  service
- Implemented token budget filtering in `GetWindow()` method with configurable
  allocation parameters
- Added efficient JSON-ND storage format using `StorageInterface.append()` for
  memory persistence
- Enhanced memory window assembly with token-aware filtering for history, tasks,
  and context sections
- Migrated to consolidated `generated/services/memory/` artifacts replacing
  legacy service files
