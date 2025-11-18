# Changelog

## 2025-11-18

- Bump version

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced output handling with asynchronous prompt rendering that waits for
  response completion
- Fixed timing issues in interactive mode with proper Promise-based output
  completion

## 2025-10-10

- Bump version

- **BREAKING**: Simplified REPL implementation with improved constructor
  parameter order (`formatter` first, `config` second)
- Enhanced command handling with unified function-based interface and state
  management
- Improved test reliability and reduced complexity to meet coding standards
  handlers
- Removed case-insensitive command handling and alphabetical sorting
- Improved error handling consistency between interactive and non-interactive
  modes

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing
- Removed direct dependencies on `marked` and `marked-terminal` packages
- Now relies solely on `@copilot-ld/libformat` for markdown formatting
  functionality
- Improved architectural separation of concerns by removing duplicate
  dependencies

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
