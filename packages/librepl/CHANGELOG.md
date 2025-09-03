# Changelog

## 2025-09-01

- Enhanced `#handleStdin` method to properly handle stdin with line breaks for
  multi-line testing
- Added support for processing multiple commands sequentially from piped input
- Added automatic exit handling when "exit" command is encountered in stdin
- Added small delays between commands in non-interactive mode to simulate
  interactive behavior
- Improved testing capabilities for REPL-based tools

## 2025-08-08

## 2025-08-28

- Fixed command processing issues in non-interactive mode (piped input) with
  proper "/" prefix handling
- Enhanced help command display with alphabetical sorting and duplicate command
  filtering
- Added command line argument support for setting initial state values
- Removed unused public API methods to minimize interface surface
- Fixed ESLint warnings and improved test coverage for command parsing scenarios

## 2025-08-12

- Initial `librepl` package implementation with `REPL` (`Read-Eval-Print-Loop`)
  utilities
- Version `v1.0.0` `stateCommands`, `builtInCommands`, `allCommands`
- Made `createStateCommand()` method private (now `#createStateCommand()`)
- Made internal implementation methods private: `initializeState()`,
  `safeOnLine()`, `handleStdin()`, `setupInteractiveMode()`
- Updated `ReplInterface` to remove `createStateCommand()` from public API
- Simplified tests to focus on essential functionality rather than internal
  implementation details
- Maintained backward compatibility for tools (`chat.js`, `search.js`) which
  only use constructor and `start()` method
- **Breaking change**: Public API now only includes `constructor()`, `start()`,
  and `showHelp()` methods
- State commands can now be initialized with `--<stateName> <value>` arguments
- Example: `node scripts/search.js --limit 10 --threshold 0.3`

- Fixed duplicated help command output by removing redundant state commands from
  help display
- Updated help command handler to avoid including state commands twice in help
  output
