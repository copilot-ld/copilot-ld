# Changelog

## 2025-10-10

- **BREAKING**: Updated `ResourceIndex` to work with simplified URI format
  without `cld:` prefix
- Enhanced `ResourceIndex.get()` method to handle `null` or `undefined`
  identifiers gracefully
- Simplified `ResourceProcessor` by extending unified `ProcessorBase` and
  removing unused parameters LLM for improved AI agent understanding
- Streamlined API with method renames (`getAll()` → `findAll()`, `getByPrefix()`
  → `findByPrefix()`) and simplified JSON handling
- Integrated policy-based access control for secure resource management
- Fixed Protocol Buffer serialization issues with proper `.finish()` calls on
  encoded data
