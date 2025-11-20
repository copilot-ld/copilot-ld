# Changelog

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Added automatic retry logic to `Client` class for handling transient gRPC
  connection failures
- Integrated `Retry` instance from `@copilot-ld/libutil` with default
  configuration (10 retries, 1000ms initial delay)
- Updated `Client` constructor to accept optional `retry` parameter for custom
  retry configuration
- Wrapped `#callMethod()` with `#retry.execute()` to automatically retry on
  `ECONNREFUSED` and `UNAVAILABLE` errors
- Bump version

## 2025-11-02

- **BREAKING**: `createTracer()` now injects `grpc.Metadata` class into Tracer
  for dependency injection
- Updated `Client.callMethod()` to remove `metadataFn` parameter from
  `observeClientCall()` call
- Simplified metadata handling - metadata is now created by Tracer, not Client
- Fixed `Client.callMethod()` to pass `metadataFactory` to
  `Observer.observeClientCall()`
- gRPC metadata factory ensures metadata is created and populated with trace
  context before RPC calls
- Updated parameter naming in `callMethod()` callback for clarity (`m` →
  `metadata` in signature)

## 2025-10-28

- Updated `Tracer` import to use direct path
  `@copilot-ld/libtelemetry/tracer.js` to avoid circular dependency
- Integrated `Observer` from `@copilot-ld/libtelemetry` for unified
  observability
- Removed manual logging and span management from `Client` and `Server` classes
- Added automatic span events: `request.sent`, `response.received` (client),
  `request.received`, `response.sent` (server)
- Added automatic request and response attribute extraction via `Observer`
- Simplified RPC implementation by delegating all observability to `Observer`
- Removed `logger()`, `tracer()`, and `debug()` methods from `Rpc` base class
  (now internal to `Observer`)
- Updated constructor signatures to remove `logFn` parameter (Observer creates
  logger internally)
- All observability now happens automatically at RPC boundaries without manual
  instrumentation

## 2025-10-28 (earlier)

- Extracted `Client` class from `base.js` into separate `client.js` file for
  better organization
- Moved `capitalizeFirstLetter` utility function to `base.js` for reuse across
  `client.js` and `index.js`
- Updated `createClient` factory in `index.js` to use shared
  `capitalizeFirstLetter` utility
- Updated generated client template to import from
  `@copilot-ld/librpc/client.js` instead of `base.js`
- Updated `index.js` exports to maintain backward compatibility

## 2025-10-27

- Updated `Client.callMethod()` to accept optional `metadata` parameter for gRPC
  metadata injection
- Trace context now propagates via gRPC metadata instead of `AsyncLocalStorage`

## 2025-10-19

- Bump version

## 2025-10-18

- Fixed unnecessary dependency: Removed unused `@copilot-ld/libconfig` from
  `package.json`

## 2025-10-15

- Bump version

## 2025-10-14

- Enhanced service base class with improved error handling and debugging
  capabilities

## 2025-10-10

- Bump version

- **BREAKING**: Migrated from runtime proto-loader to pre-compiled service
  definitions for improved performance
- Enhanced aggregated exports system with convenient `services` and `clients`
  objects for cleaner imports
- **TEMPLATE**: Enhanced `exports.js` generation with proper service/client
  aggregation using `exports.js.mustache`

## 2025-09-25

## 2025-09-24

- **BREAKING**: Now contains all generated service bases and clients previously
  in project root `generated/`
- Added dynamic import system for generated service/client exports
- Generated code now located in `packages/librpc/generated/` with automatic
  aggregation in `exports.js`
- Enhanced package to export `services` and `clients` objects for convenient
  access
- Improved separation of concerns: RPC infrastructure separated from type
  definitions
- Fixed circular dependency issues by moving service/client generation from
  `@copilot-ld/libtype`

## 2025-09-16

- Bump version one last time, really
- Bump version one last time
- Bump version one more time
- Bump version again
- Bump version for public package publishing
- Removed unused `createClient()` function as it was not being used anywhere in
  the codebase

## 2025-09-12

- Fixed test case `should call service methods during setup` which was making
  incorrect assumptions about proto file loading
- Simplified test to verify service method invocation without requiring actual
  server startup and file system operations

## 2025-09-11

- **BREAKING**: Renamed package from `@copilot-ld/libservice` to
  `@copilot-ld/librpc` with complete architectural restructuring
- **BREAKING**: Refactored class hierarchy - `Actor` → `Rpc`, `Service` →
  `Server`, removed `ServiceInterface`
- Simplified `Client` architecture by removing dynamic method generation and
  implementing explicit typed RPC wrappers
- Consolidated protobuf schema loading to use `generated/proto` exclusively for
  single source of truth
- Enhanced path resolution with upward directory search and environment variable
  override support

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
- Updated `createClient` function to accept `createLoggerFn` parameter
- Integrated with `@copilot-ld/libutil` for centralized logging

## 2025-08-12

- Initial `libservice` package implementation
- Added service layer utilities including authentication and interceptors
- Version `v1.0.0`
