# Changelog

## 2026-01-25

- Added service name argument to `start`, `stop`, and `status` commands
- `rc start <service>` starts services from first through target (dependencies)
- `rc stop <service>` stops services from target through last (dependents first)
- `rc status <service>` shows status of specific service only
- Fixed: `rc stop <service>` no longer shuts down svscan daemon (only full stop does)
- Simplified: inlined `readPid()` and `isAlive()` into `isSvscanRunning()`

## 2026-01-16

- Added `ServiceManager` class with dependency injection for testability
- Consolidated socket utilities into `manager.js` and `index.js`
- Added unit tests in `test/manager.test.js`

## 2026-01-15

- Rewrote as thin service manager communicating with svscan via Unix socket
- Added `--silent` flag to suppress non-error output
- Migrated to `createInitConfig()` from libconfig
- All output now uses RFC 5424 logging format
