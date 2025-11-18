# Changelog

## 2025-11-18

- Bump version

## 2025-10-19

- Bump version
- Fixed `rel-changes` to use `process.env.INIT_CWD` when run via `npx` to
  correctly detect working directory
- Fixed `rel-bump` to use `process.env.INIT_CWD` when run via `npx` to correctly
  detect working directory
- Updated `ReleaseChanges` class to accept working directory parameter and
  resolve paths absolutely
- Updated `ReleaseBumper` class to accept working directory parameter and
  resolve paths absolutely
- Added `cwd` option to all git commands in both classes to ensure they run in
  correct directory
- Updated all file operations in `ReleaseBumper` to use absolute paths
- Added tests for working directory handling in both classes

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-09-11

- Enhanced `ReleaseBumper.bump()` with optional `force` parameter for tag
  overwrite functionality
- Updated test fixtures to reference `scripts/` directory for directory
  restructure alignment
- Stabilized release workflow with improved package alignment and version
  management
