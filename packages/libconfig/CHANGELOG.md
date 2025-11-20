# Changelog

## 2025-11-19

- Bump version

## 2025-11-18

- Bump version

## 2025-10-27

- **BREAKING**: Replaced static `.create()` methods with factory functions for
  consistent developer experience
- **BREAKING**: Removed `ServiceConfig`, `ExtensionConfig`, and `ScriptConfig`
  subclasses - factory functions now directly instantiate `Config` class with
  appropriate namespace
- Moved `Config` class to separate `config.js` file for better code organization
- Added `createConfig()`, `createServiceConfig()`, `createExtensionConfig()`,
  and `createScriptConfig()` factory functions
- Simplified factory function implementations to directly use `Config` class
  constructor with namespace parameter
- Updated all imports and usage across services, extensions, scripts, packages,
  tests, examples, and documentation
- Factory functions now return `Config` instances instead of specialized
  subclass instances

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-10-02

- **BREAKING**: Migrated configuration format from YAML (`config.yml`) to JSON
  (`config.json`) for simplified parsing
- **BREAKING**: Removed `dotenv` and `js-yaml` dependencies, using Node.js
  `--env-file` flag and native JSON parsing instead
- Enhanced configuration loading with native Node.js APIs for improved
  performance and reduced dependencies

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **BREAKING**: Renamed `ToolConfig`/`ToolConfigInterface` to
  `ScriptConfig`/`ScriptConfigInterface` for directory alignment
- **BREAKING**: Made `dataPath()`, `storagePath()`, `publicPath()`, and
  `protoFile()` methods async with improved path resolution
- Enhanced configuration classes with async factory methods (`Config.create()`,
  `ServiceConfig.create()`, etc.)
- Simplified path resolution using storage abstraction layer with automatic
  parent directory search
- Improved error handling with clear messages instead of fallback paths

## 2025-08-08

- Version bump
