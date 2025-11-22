# Changelog

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-29

- Removed `resourceIndex` dependency from `GraphService` - resource loading now
  handled by Tool service
- Updated `server.js` to remove `resourceIndex` initialization

## 2025-10-28

- Removed manual `this.debug()` calls from `QueryByPattern()` and
  `GetOntology()` methods
- Observability now handled automatically by `@copilot-ld/librpc` `Observer`
- Service implementation focuses purely on business logic

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Simplified service interface with `QueryByPattern` and
  `GetOntology` RPC methods
- Enhanced graph query capabilities with pattern-based search and comprehensive
  ontology support for agent query planning
- Simplified service initialization using `createGraphIndex()` and
  `createResourceIndex()` factory functions
