# Changelog

## 2025-09-08

- **REFACTOR**: `ResourceProcessor` now extends `ProcessorBase` from
  `@copilot-ld/libutil` for unified batch processing
- **REMOVED**: `ResourceProcessorInterface` in favor of shared
  `ProcessorInterface` from `@copilot-ld/libutil`
- Simplified batch processing logic by delegating to `ProcessorBase` while
  maintaining semantic descriptor generation
- Enhanced `ResourceProcessor` with batch LLM prompting similar to
  `VectorProcessor` pattern
- **NEW**: Initial implementation of universal resource management system with
  URI-based identification
- Enhanced `ResourceProcessor` with semantic descriptor generation powered by
  LLM for improved AI agent understanding
- Streamlined API with method renames (`getAll()` → `findAll()`, `getByPrefix()`
  → `findByPrefix()`) and simplified JSON handling
- Integrated policy-based access control for secure resource management
- Fixed Protocol Buffer serialization issues with proper `.finish()` calls on
  encoded data
