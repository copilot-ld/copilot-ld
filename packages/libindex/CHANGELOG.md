# Changelog

## 2025-10-24

- **REFACTOR**: Extracted `IndexBase` from `@copilot-ld/libutil` to resolve
  circular dependency with `@copilot-ld/libtype`
- **`IndexBase`**: Base class for storage-backed indexes with shared filtering
  logic
- **`IndexInterface`**: TypeScript-style interface definition for index
  implementations
- Comprehensive test suite covering all `IndexBase` functionality
- Support for prefix filtering, limit filtering, and token-based filtering
- Proper protobuf object reconstruction using `resource.Identifier.fromObject()`
- Static import of `@copilot-ld/libtype` (no circular dependency)
- `@copilot-ld/libtype`: For Protocol Buffer type definitions
- No other dependencies (intentionally minimal to break circular dependency)
- Applications using `IndexBase` from `@copilot-ld/libutil` must update imports
  to use `@copilot-ld/libindex` instead
- Affected packages: `@copilot-ld/libgraph`, `@copilot-ld/libvector`,
  `@copilot-ld/libmemory`
