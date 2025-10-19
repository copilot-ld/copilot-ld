# Changelog

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
