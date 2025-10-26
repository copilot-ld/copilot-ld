# Changelog

## 2025-10-21

- Added `storage()` method to `ResourceIndex` to return the storage instance
- Added `add(resource)` method to `ResourceIndex` as an alias for `put()`
- **BREAKING**: Simplified `get()` signature to `get(ids, actor)` where `ids` is
  `string[]` and `actor` is optional - always returns array of resources
- Added `@implements {IndexInterface}` JSDoc to `ResourceIndex` class

## 2025-10-21

- Added canonical RDF quad ordering in `#quadsToRdf()` to ensure `rdf:type`
  assertions appear first in N-Quads serialization
- N-Quads output now follows RDF best practices with deterministic ordering

## 2025-10-21

- **BREAKING**: Updated `createResourceIndex()` signature to `(prefix, policy?)`
  and now forces local storage type internally. All callers must pass a storage
  prefix such as `"resources"`.

## 2025-10-21

- **BREAKING**: Reordered `ResourceProcessor` constructor parameters to
  `(baseIri, resourceIndex, knowledgeStorage, skolemizer, describer?, logger?)`
- Renamed `DescriptorProcessor` to `Describer` and file `descriptor.js` to
  `describer.js`
- Made `describer` optional; descriptors are skipped when not provided
- Made `logger` optional; falls back to no-op debug logger when omitted
- Updated `bin/resources.js` and tests to reflect new signature and naming

## 2025-10-19

- Bump version

## 2025-10-18

- Moved `resources.js` script from `scripts/` to `bin/resources.js` as a binary
- Added `bin` field to `package.json` to expose `resources` binary
- Updated script with shebang line and proper error handling
- Fixed missing dependency: Added `@copilot-ld/libutil` to `package.json`

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced `ResourceProcessor` with HTML minification and extracted
  `DescriptorCreator` class for improved resource processing
- **BREAKING**: Updated `ResourceIndex` to use simplified URI format without
  `cld:` prefix
- Added `createResourceIndex()` factory function for simplified index creation
- Improved Protocol Buffer handling and test coverage with `ProcessorBase`
  extension
