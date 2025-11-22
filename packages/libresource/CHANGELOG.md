# Changelog

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-31

- **BREAKING**: Extracted `HTML-to-RDF` parsing functionality into new `Parser`
  class in `parser.js` for better separation of concerns
- **BREAKING**: Updated `ResourceProcessor` constructor to inject `Parser` as
  fourth parameter:
  `(baseIri, resourceIndex, knowledgeStorage, parser, describer, logger)`
- Implemented smart RDF merging in `ResourceProcessor` to handle duplicate
  entity IRIs across multiple HTML files using union semantics
- Added `#rdfToQuads()` method to parse N-Quads strings back into quad objects
  for merging
- Added `#unionQuads()` method to merge quad arrays using RDF union semantics
  with deduplication
- Enhanced `#parseHTML()` to detect duplicate resources, merge their RDF
  triples, and update existing resources with complete data
- Added debug logging for resource merge operations showing quad count changes
- Exported `Parser` class from package index for external use

## 2025-10-26

- Added performance tests in `test/libresource.perf.js` for
  `ResourceIndex.get()`, `ResourceIndex.put()`, policy evaluation overhead, and
  memory stability validation

## 2025-10-21

- **BREAKING**: Simplified `ResourceIndex` API with `add()` alias for `put()`,
  streamlined `get()` signature to `get(ids, actor)`, and renamed
  `DescriptorProcessor` to `Describer`
- **BREAKING**: Reordered `ResourceProcessor` constructor parameters and made
  `describer` and `logger` optional
- **BREAKING**: Updated `createResourceIndex()` to force local storage with
  `(prefix, policy?)` signature
- Enhanced N-Quads output with canonical RDF quad ordering (`rdf:type`
  assertions first)

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
