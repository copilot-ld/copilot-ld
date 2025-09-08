# Changelog

## 2025-09-08

- **NEW**: Added `ProcessorInterface` and `ProcessorBase` for unified batch
  processing
- `ProcessorInterface` defines common batch processing contract with
  `process()`, `processBatch()`, and `processItem()` methods
- `ProcessorBase` provides complete batch management logic with configurable
  batch sizes, progress tracking, and error handling
- Extracted common patterns from `VectorProcessor` and `ResourceProcessor` to
  eliminate duplication
- **NEW**: Initial implementation of centralized logging utilities with
  namespace support
- Added `Logger` class and `logFactory` function for consistent logging across
  the platform
- Implemented `LoggerInterface` definition for type safety and consistency
