# Changelog

## 2025-10-13

- **BREAKING**: Renamed from "triple" to "graph" terminology throughout
  (`TripleIndex` → `GraphIndex`, `TripleProcessor` → `GraphProcessor`)
- Refactored `GraphIndex` to extend `IndexBase` with shared filtering logic
  including prefix, limit, and token constraints
- Enhanced ontology generation with comprehensive dataset summaries including
  predicates, types, and common patterns
- Fixed wildcard pattern handling and missing graph data file initialization
  errors
