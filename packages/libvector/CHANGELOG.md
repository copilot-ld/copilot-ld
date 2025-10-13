# Changelog

## 2025-10-13

- Refactored `VectorIndex` to extend `IndexBase` from `@copilot-ld/libutil` with
  shared filtering methods for prefix, limit, and token constraints

- **BREAKING**: Redesigned `VectorIndex` with Map-based storage for O(1)
  resource lookups and enhanced performance
- Enhanced `VectorProcessor` with unified batch processing and simplified URI
  format handling
- Improved dual-index architecture supporting separate content and descriptor
  vector indexes
- Streamlined interface by removing deprecated methods and improving error
  handling
