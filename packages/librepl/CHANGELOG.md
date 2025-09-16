# Changelog

## 2025-09-16

- Bump version again
- Bump version for public package publishing

## 2025-09-11

- **BREAKING**: Simplified public API to include only `constructor()`,
  `start()`, and `showHelp()` methods
- Enhanced multi-line command processing with improved stdin handling and
  automatic exit detection
- Added command line argument support for setting initial state values (e.g.,
  `--limit 10 --threshold 0.3`)
- Improved help system with alphabetical sorting and duplicate filtering
- Fixed command processing issues in non-interactive mode with proper prefix
  handling
