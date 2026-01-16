# Changelog

## 2026-01-16

- Added `ServiceManager` class with dependency injection for testability
- Consolidated socket utilities into `manager.js` and `index.js`
- Added unit tests in `test/manager.test.js`

## 2026-01-15

- Rewrote as thin service manager communicating with svscan via Unix socket
- Added `--silent` flag to suppress non-error output
- Migrated to `createInitConfig()` from libconfig
- All output now uses RFC 5424 logging format
