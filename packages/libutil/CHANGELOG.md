# Changelog

## 2025-09-11

- **SIMPLIFIED**: Removed unused `itemIndex` and `globalIndex` parameters from
  `processItem()` method in `ProcessorInterface` and `ProcessorBase`
- **NEW**: Added `ProcessorInterface` and `ProcessorBase` for unified batch
  processing with configurable batch sizes and progress tracking
- **NEW**: Initial implementation of centralized logging utilities with `Logger`
  class and `logFactory` function
- Extracted common patterns from `VectorProcessor` and `ResourceProcessor` to
  eliminate duplication
- Implemented `LoggerInterface` definition for type safety and consistency
  across the platform
