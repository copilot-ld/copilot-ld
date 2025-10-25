# Changelog

## 2025-10-24

- **REFACTOR**: Migrated from `@copilot-ld/libutil` to `@copilot-ld/libindex`
  for `IndexBase` functionality
- Moved `@copilot-ld/libutil` to `devDependencies` (only used by CLI tools and
  offline processor, not needed for runtime library code)
- **Fixed**: Token filtering in graph queries now works correctly - identifiers
  now include `tokens` field when added to graph indexes, enabling proper token
  budget enforcement via `_applyTokensFilter()`

## 2025-10-21

- **BREAKING**: Renamed `GraphIndex.addItem()` to `add()` for consistency with
  `IndexInterface`
- **BREAKING**: Renamed `GraphIndex.hasItem()` to `has()` for consistency with
  `IndexInterface`
- Added `@implements {IndexInterface}` JSDoc to `GraphIndex` class
- Updated `GraphProcessor` to use new method names

## 2025-10-21

- Simplified property instance count format to `Instances: X` to match class
  instance format
- Removed redundant class name from property comments since context is implicit

## 2025-10-21

- Fixed `OntologyProcessor` to count distinct entities using each property
  rather than total triple occurrences
- Changed `#classPredicates` from `Map<class, Map<predicate, count>>` to
  `Map<class, Map<predicate, Set<subject>>>` for accurate instance counts
- Property usage counts in `sh:comment` now correctly reflect the number of
  distinct entities using each property

## 2025-10-21

- Added relationship instance counts to property shapes in generated SHACL
  ontology via `sh:comment`
- Enhanced `OntologyProcessor.buildShacl()` to include per-class predicate usage
  counts for AI agent query planning

## 2025-10-21

- Added defensive quad sorting in `GraphProcessor.processItem()` to ensure
  `rdf:type` assertions are processed before property triples
- Added `#isTypePredicate()` helper method for predicate type checking
- Fixed inverse relationship detection by guaranteeing proper processing order
  for `OntologyProcessor`

## 2025-10-21

- Enhanced `OntologyProcessor` to track object types for properties and generate
  `sh:class` constraints for properties that consistently point to typed
  resources
- Enhanced `OntologyProcessor` to detect and generate `sh:inversePath`
  constraints for inverse relationship pairs
- Added `#predicateDirections` tracking to analyze directional relationships
  between typed entities
- Added `#findInversePredicate()` method to identify inverse predicates between
  class pairs (e.g., `worksFor` ↔ `employee`)
- Added `sh:inversePath` generation in property shapes when inverse
  relationships are detected with >50% confidence
- Added `sh:nodeKind sh:IRI` constraint for object properties with class
  constraints
- **BREAKING**: Reordered `GraphIndex` constructor parameters to
  `(storage, store, prefixes, indexKey)`; update all call sites accordingly

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
