# Changelog

## 2025-10-15

- Enhanced `ResourceProcessor` with HTML minification and extracted
  `DescriptorCreator` class for improved resource processing
- **BREAKING**: Updated `ResourceIndex` to use simplified URI format without
  `cld:` prefix
- Added `createResourceIndex()` factory function for simplified index creation
- Improved Protocol Buffer handling and test coverage with `ProcessorBase`
  extension
