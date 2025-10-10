# Changelog

## 2025-10-10

- Simplified security middleware architecture by removing unused
  `RequestValidator` and rate limiting functionality
- Refactored middleware into focused `ValidationMiddleware` and `CorsMiddleware`
  classes with dependency injection
- Reduced complexity of validation logic through focused helper methods
- Let services handle their own errors naturally using Hono built-in error
  handling
- Reduced total file size from 352 to 193 lines

## 2025-09-19

- Added dependency on `@copilot-ld/libconfig` for enhanced configuration
  management integration

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing

## 2025-08-12

- Initial `libweb` package implementation
- Added web utilities and `HTTP` helpers
- Version `v1.0.0`
