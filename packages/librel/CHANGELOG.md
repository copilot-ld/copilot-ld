# Changelog

## 2025-09-03

- Updated test fixtures to reference `scripts/` directory instead of `tools/`
- Added optional `force` behavior to `ReleaseBumper.bump()` allowing tag
  overwrite when a tag already exists
- Updated `ReleaseBumperInterface.bump()` signature to accept an `options`
  parameter with `{ force?: boolean }`

## 2025-08-08

- Release workflow stabilization: fixed `Node.js` setup and performed required
  version reset/bump to align packages
