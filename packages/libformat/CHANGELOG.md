# Changelog

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
