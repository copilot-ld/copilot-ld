# Changelog

## 2025-10-18

- Moved `resources.js` script from `scripts/` to `bin/resources.js` as a binary
- Added `bin` field to `package.json` to expose `resources` binary
- Updated script with shebang line and proper error handling
- Fixed missing dependency: Added `@copilot-ld/libutil` to `package.json`

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced `ResourceProcessor` with HTML minification and extracted
  `DescriptorCreator` class for improved resource processing
- **BREAKING**: Updated `ResourceIndex` to use simplified URI format without
  `cld:` prefix
- Added `createResourceIndex()` factory function for simplified index creation
- Improved Protocol Buffer handling and test coverage with `ProcessorBase`
  extension
