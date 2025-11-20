# Changelog

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-29

- Removed `resourceIndex` dependency from `VectorService` - resource loading now
  handled by Tool service
- Updated `server.js` to remove `resourceIndex` initialization

## 2025-10-28

- Removed manual `this.debug()` calls from `#queryByText()` method
- Observability now handled automatically by `@copilot-ld/librpc` `Observer`
- Service implementation focuses purely on business logic

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- **BREAKING**: Replaced identifier-based queries with text-based
  `QueryByContent` and `QueryByDescriptor` methods
- Enhanced service with direct LLM integration for automatic embedding
  generation
- Streamlined interface to return content strings directly with dual-index
  architecture
- Simplified service initialization using `createResourceIndex()` factory
  function
