# Changelog

## 2025-11-19

- Bump version

## 2025-11-18

- Bump version

## 2025-10-28

- Updated `client.js.mustache` template to import `Client` from
  `@copilot-ld/librpc/client.js` instead of `base.js`

## 2025-10-27

- Updated `service.js.mustache` to extract trace context from gRPC metadata
  (`x-trace-id`, `x-span-id`) and pass to SERVER spans
- Updated `client.js.mustache` to inject trace context into gRPC metadata for
  cross-service trace propagation
- Added `#createMetadataWithTrace()` private method to client template for
  metadata injection
- Generated handlers now propagate trace context across service boundaries via
  gRPC metadata

## 2025-10-26

- Updated `service.js.mustache` template to include automatic tracing via
  `createTracer` factory
- Updated `client.js.mustache` template to include automatic tracing via
  `createTracer` factory
- Generated service base classes now create SERVER spans for all RPC methods
- Generated client classes now create CLIENT spans for all RPC calls
- Added `tracerFn` parameter to service and client constructors with default
  `createTracer` factory
- Spans automatically track success/failure status and error messages
- Tracing gracefully degrades if trace service is unavailable

## 2025-10-19

- Bump version

## 2025-10-15

- Bump version

## 2025-10-14

- Bump version

## 2025-10-03

- **NEW**: Created dedicated `@copilot-ld/libcodegen` package for Protocol
  Buffer code generation
- Extracted `Codegen` class and `codegen` binary from `@copilot-ld/libutil` for
  better separation of concerns
- Provides unified interface for generating types, services, clients, and
  definitions from `.proto` schemas
