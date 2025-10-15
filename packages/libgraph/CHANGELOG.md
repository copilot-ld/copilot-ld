# Changelog

## 2025-10-14

- **BREAKING**: Renamed from "triple" to "graph" terminology throughout
  (`TripleIndex` → `GraphIndex`, `TripleProcessor` → `GraphProcessor`)
- Enhanced `GraphIndex` to extend `IndexBase` with shared filtering logic and
  improved ontology generation
- Added `createGraphIndex()` factory function for simplified index creation with
  default configuration
- Fixed wildcard pattern handling and missing graph data file initialization
  errors
