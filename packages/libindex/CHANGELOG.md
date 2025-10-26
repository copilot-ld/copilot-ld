# Changelog

## 2025-10-24

- **NEW**: Created `@copilot-ld/libindex` package with `IndexBase` class and
  `IndexInterface` typedef
- Extracted from `@copilot-ld/libutil` to resolve circular dependency with
  `@copilot-ld/libtype`
- Provides shared filtering logic for prefix, limit, and token-based filtering
  with proper protobuf object reconstruction
- Applications using `IndexBase` from `@copilot-ld/libutil` must update imports
  to `@copilot-ld/libindex`
