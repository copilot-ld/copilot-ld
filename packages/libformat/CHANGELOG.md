# Changelog

## 2025-11-19

- Bump version
- Bump version

## 2025-11-07

- Bump version
- Added marked extension to check language support using `supportsLanguage()`
  from `cli-highlight` before attempting syntax highlighting
- Unsupported languages (like mermaid) are now rendered as plain code blocks
  without language specification to avoid highlight.js warnings
- Imported `supportsLanguage` from `cli-highlight` to validate language support
- Removed `throwOnError: false` option (no longer needed with language checking)
- Removed ineffective `showErrors: false` option and replaced with proper
  `ignoreIllegals` configuration

## 2025-11-02

- Added `silent: true` option to `TerminalFormatter` to suppress marked warnings
- Added `showErrors: false` option to `markedTerminal` plugin in
  `TerminalFormatter`

## 2025-10-31

- Bump version

## 2025-10-19

- Bump version

## 2025-10-18

- Fixed unnecessary dependency: Removed unused `@copilot-ld/libtype` from
  `package.json`

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-10-03

- Simplified type definitions by replacing `FormatterInterface` class with JSDoc
  `@typedef`
- Replaced `jsdom` and `dompurify` with lighter-weight `sanitize-html` for HTML
  sanitization

## 2025-09-16

- Downgraded `marked` from `^16.1.2` to `^15.0.12` to resolve dependency
  conflict with `marked-terminal@^7.3.0`

## 2025-08-12

- Initial `libformat` package implementation
- Added text formatting utilities
- Version `v1.0.0`
