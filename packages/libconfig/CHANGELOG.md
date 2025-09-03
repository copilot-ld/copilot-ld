# Changelog

## 2025-09-03

- **BREAKING**: Renamed `ToolConfig` class to `ScriptConfig` to align with
  directory restructure
- **BREAKING**: Updated `ToolConfigInterface` to `ScriptConfigInterface`
- Changed configuration namespace from `"tool"` to `"script"` for consistency

## 2025-08-15

- Removed tests for deleted `dataPath()`, `storagePath()`, `publicPath()`, and
  `protoFile()` methods to maintain test suite consistency
- Fixed test "`storageFactory` creates `S3Storage` with environment variables"
  by properly mocking the `storageFn` parameter to accept both `basePath` and
  `process` arguments
- Removed convoluted try/catch fallback logic from `dataPath()`,
  `storagePath()`, `publicPath()`, and `protoFile()` methods
- Methods now throw clear error messages when directories or files don't exist
  instead of providing fallback paths
- Updated `dataPath()`, `storagePath()`, `publicPath()`, and `protoFile()`
  methods to use storage `path()` method for consistent path resolution
- Simplified path generation logic by leveraging storage abstraction layer
- All path methods now properly utilize the storage interface for cross-platform
  compatibility

## 2025-08-14

- Added `#findPath()` method that searches for paths in "./", "../", and
  "../../" directories
- **BREAKING**: `dataPath()`, `storagePath()`, `publicPath()`, and `protoFile()`
  methods are now async
- Updated `#loadConfigFile()` and `githubToken()` to use `#findPath()` for
  better path resolution
- All path-related methods now search parent directories automatically for
  improved flexibility

## 2025-08-13

- **BREAKING**: Config classes are now async and must be created using factory
  methods
- **BREAKING**: `githubToken()` method is now async and returns a Promise
- Added `Config.create()`, `ServiceConfig.create()`, `ExtensionConfig.create()`,
  and `ToolConfig.create()` static factory methods
- Config classes now properly utilize libstorage for loading `config.yml` and
  `.ghtoken` files
- Config loading now falls back gracefully from storage to direct file system
  access
- Fully decoupled libconfig from direct file system dependency

## 2025-08-08

- Version bump
