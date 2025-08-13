# Changelog

## 2025-08-13

- Added `logFn` parameter to `ActorInterface`, `ClientInterface`, and
  `ServiceInterface` constructors
- Added `logger()` method to `ActorInterface` and `Actor` class implementation
- Updated `createClient` function to accept `logFactoryFn` parameter
- Integrated with `@copilot-ld/libutil` for centralized logging

## 2025-08-12

- Initial `libservice` package implementation
- Added service layer utilities including authentication and interceptors
- Version `v1.0.0`
