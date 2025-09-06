# Changelog

## 2025-09-05

- Fixed `Actor.loadProto()` path resolution bug where it incorrectly relied on
  `process.cwd()` and failed inside nested execution contexts; it now searches
  upward from both module directory and current directory for `generated/proto`
  and supports explicit override via `SERVICE_PROTO_DIR` or `PROTO_ROOT`.
- Added internal helper `#loadFromFile()` for clearer separation of discovery vs
  loading logic.

## 2025-09-02

## 2025-09-05

- Updated `Actor.loadProto()` to load schemas exclusively from `generated/proto`
  (removed previous dynamic / storage-based lookup logic)
- Enabled single operational source of truth for protobuf schemas to simplify
  service extension and avoid mixed generated locations

- Finalized `Client` simplification by removing dynamic method generation and
  `fireAndForget`; generated clients now expose explicit RPC wrappers that call
  `callMethod()` internally
- Preserved subclass RPC overrides (e.g., `LlmClient.CreateCompletions()`) so
  typed request/response conversions run, fixing plain-object responses missing
  `withIdentifier()`
- Removed unused `createTypedMessage()` helper from `index.js`
- Test harness: added creation of `generated/proto/test.proto` during tests to
  satisfy new file existence check in `Actor.loadProto()` while continuing to
  mock loader output for behavioral validation

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
