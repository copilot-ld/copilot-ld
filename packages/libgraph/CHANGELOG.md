# Changelog

## 2025-10-18

- Moved `graphs.js` script from `scripts/` to `bin/graphs.js` as a binary
- Added `bin` field to `package.json` to expose `graphs` binary
- Updated script with shebang line and proper error handling

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Renamed from "triple" to "graph" terminology throughout
  (`TripleIndex` → `GraphIndex`, `TripleProcessor` → `GraphProcessor`)
- Enhanced `GraphIndex` to extend `IndexBase` with shared filtering logic and
  improved ontology generation
- Added `createGraphIndex()` factory function for simplified index creation with
  default configuration
- Fixed wildcard pattern handling and missing graph data file initialization
  errors
