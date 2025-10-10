# Changelog

## 2025-10-10

- Added ontology generation facility to `GraphProcessor` that creates compact dataset summaries for agent query crafting
- Added `saveOntology()` method to `GraphProcessor` that tracks predicates, types, subjects, and common patterns
- Enhanced `processItem()` to update ontology statistics during graph processing
- Ontology data stored in `ontology.json` includes predicate frequencies, type counts, subject examples, and query patterns
- Fixed issue in `queryItems()` where wildcard patterns using `*` were not properly handled as wildcards
- Unified wildcard logic by creating shared `isWildcard()` utility function used by both `GraphIndex.queryItems()` and `parseGraphQuery()`
- Removed duplicate wildcard checking logic for improved maintainability
- Renamed `TripleIndex` class to `GraphIndex`
- Renamed `TripleProcessor` class to `GraphProcessor` 
- Renamed `parseTripleQuery()` function to `parseGraphQuery()`
- Updated storage prefix from "triples" to "graphs"
- Updated all documentation and comments from "triple" to "graph" terminology
- Bump version

## 2025-10-08

- Fixed issue in `loadData()` where missing `graphs.jsonl` file caused `ENOENT`
  errors during initialization
- Added file existence check before attempting to read graph index data

## 2025-10-07

- Initial version
