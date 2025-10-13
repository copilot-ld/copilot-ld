# Changelog

## 2025-10-13

- **BREAKING**: Replaced `QueryItems` and `GetItem` with text-based
  `QueryByContent` and `QueryByDescriptor` methods
- Enhanced service with direct LLM integration for automatic embedding
  generation from text queries
- Streamlined interface to return content strings directly instead of resource
  identifiers
- Improved dual-index architecture with integrated `ResourceIndex` for content
  retrieval
