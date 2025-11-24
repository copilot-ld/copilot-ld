# Changelog

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-10-28

- Changed `BufferedIndex` constructor to accept `config` parameter instead of
  `options`
- Updated parameter names to use snake_case: `flush_interval` and
  `max_buffer_size`
- Maintains backward-compatible defaults (5000ms and 1000 items)
- Added comprehensive test suite for `BufferedIndex` covering constructor
  configuration, buffered operations, automatic flush behavior, and graceful
  shutdown

## 2025-10-26

- Added `BufferedIndex` class extending `IndexBase` for high-volume writes with
  periodic flushing
- Configurable flush interval (default 5000ms) and max buffer size (default 1000
  items)
- Provides `flush()` and `shutdown()` methods for graceful batch write handling
- Exports `BufferedIndex` from main package entry point

## 2025-10-24

- **NEW**: Created `@copilot-ld/libindex` package with `IndexBase` class and
  `IndexInterface` typedef
- Extracted from `@copilot-ld/libutil` to resolve circular dependency with
  `@copilot-ld/libtype`
- Provides shared filtering logic for prefix, limit, and token-based filtering
  with proper protobuf object reconstruction
- Applications using `IndexBase` from `@copilot-ld/libutil` must update imports
  to `@copilot-ld/libindex`
