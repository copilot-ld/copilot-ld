# Changelog

## 2025-09-02

- Finalized `Client` simplification by removing dynamic method generation and
  `fireAndForget`; generated clients now expose explicit RPC wrappers that call
  `callMethod()` internally
- Preserved subclass RPC overrides (e.g., `LlmClient.CreateCompletions()`) so
  typed request/response conversions run, fixing plain-object responses missing
  `withIdentifier()`
- Removed unused `createTypedMessage()` helper from `index.js`

## 2025-09-01

- **BREAKING**: Simplified `Client` class architecture by removing dynamic
  method generation and fire-and-forget functionality
- Replaced complex dynamic method setup with simple `callMethod()` for direct
  gRPC calls
- Updated client code generation to use explicit method implementations instead
  of dynamic `super` calls
- Fixed issue where generated client method overrides were being ignored due to
  dynamic method overwriting
- Removed `fireAndForget` object and `#setupMethods()` complexity
- Generated clients now have predictable, debuggable method calls that actually
  execute

## 2025-08-17

- Centralized auth and error handling in `Service`; handlers are auto-wrapped
  via `#wrapUnary()`.
- Simplified generated service bases so method stubs can remain minimal.

## 2025-08-15

- Removed `protoFile` property from mock config object in tests following
  deletion of `protoFile()` method from `Config` class

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
