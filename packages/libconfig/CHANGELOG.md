# Changelog

## 2025-09-16

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
