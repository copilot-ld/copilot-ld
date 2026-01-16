# Changelog

## 2026-01-16

- Renamed classes for clarity: `ServiceState` → `ProcessState`, `ServiceLogger`
  → `LogWriter`, `bin/logger.js` → `bin/log.js`
- Added log process supervision with automatic restart on crash
- Added unit tests for `ProcessState`, `LongrunProcess`, and `SupervisionTree`

## 2026-01-15

- Initial release with process supervision inspired by s6/daemontools
- Added `bin/svscan.js` pure supervision daemon with Unix socket IPC
- Added `LongrunProcess` for daemon supervision and `OneshotProcess` for init
  scripts
- Added `SupervisionTree` for managing multiple supervised processes
- All output uses RFC 5424 logging format
