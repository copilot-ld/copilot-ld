# Changelog

## 2025-10-26

- Added performance tests in `test/libgraph.perf.js` for `parseGraphQuery()`,
  `GraphIndex.loadData()`, `GraphIndex.query()`, and memory stability validation
- **REFACTOR**: Separated `OntologyProcessor` data collection from serialization
  with new pluggable `ShaclSerializer` class
- Enhanced ontology generation with inverse relationship detection, class
  constraints, and instance counts in SHACL output
- Added comprehensive test coverage for `GraphProcessor` and `OntologyProcessor`

## 2025-10-24

- **Fixed**: Token filtering in graph queries by ensuring identifiers include
  `tokens` field for proper budget enforcement
- **REFACTOR**: Migrated from `@copilot-ld/libutil` to `@copilot-ld/libindex`
  for `IndexBase` functionality

## 2025-10-21

- **BREAKING**: Renamed `GraphIndex` methods to match `IndexInterface`
  (`addItem()` → `add()`, `hasItem()` → `has()`)
- **BREAKING**: Reordered `GraphIndex` constructor parameters to
  `(storage, store, prefixes, indexKey)`
- Enhanced SHACL ontology generation with property instance counts and improved
  formatting

## 2025-10-19

- Bump version

## 2025-10-18

- Moved `graphs.js` script from `scripts/` to `bin/graphs.js` as a binary
- Added `bin` field to `package.json` to expose `graphs` binary
- Updated script with shebang line and proper error handling
- Fixed missing dependencies: Added `@copilot-ld/libstorage`,
  `@copilot-ld/libtype`, and `@copilot-ld/libutil` to `package.json`

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
