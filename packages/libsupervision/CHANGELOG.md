# Changelog

## 2026-01-26

- Initial release with s6/daemontools-inspired process supervision
- `LongrunProcess` for daemon supervision, `OneshotProcess` for init scripts
- `SupervisionTree` manages multiple processes via `svscan.js` Unix socket IPC
