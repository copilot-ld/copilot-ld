# Changelog

## 2025-10-24

- **BREAKING**: Enhanced error handling in `filterByBudget()` to throw error
  when identifier missing `tokens` field
- **REFACTOR**: Migrated from `@copilot-ld/libutil` to `@copilot-ld/libindex`
  for `IndexBase` functionality

## 2025-10-18

- **BREAKING**: Renamed `MemoryIndex.addItem()` to `add()` for consistency with
  `IndexInterface`

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced budget calculation to use ratio-based allocation with `Math.round()`
  for consistent token distribution
- Updated tests with proper protobuf object creation using
  `resource.Identifier.fromObject()`
- **BREAKING**: `MemoryWindow.buildWindow()` now expects allocation ratios (0-1)
  instead of absolute token values

## 2025-10-13

- **REFACTOR**: Aligned `MemoryIndex` with `IndexBase` patterns for better
  framework integration
- **BREAKING**: Simplified API with `addItem()` replacing `append()` and removed
  `forResource` parameters
- Improved memory deduplication and supports callback-based resource resolution
  for service integration
