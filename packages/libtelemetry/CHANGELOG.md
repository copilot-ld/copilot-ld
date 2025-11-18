# Changelog

## 2025-11-18

- Bump version

## 2025-10-28

- Removed `Tracer` and `Span` from main exports to avoid circular dependency
  with `@copilot-ld/libtype` during codegen
- `Tracer` must now be imported directly from
  `@copilot-ld/libtelemetry/tracer.js` when needed
- `Span` must now be imported directly from `@copilot-ld/libtelemetry/span.js`
  when needed
- Added `Logger` class moved from `@copilot-ld/libutil`
- Added `createLogger()` factory function for creating logger instances
- Added `Observer` class for unified RPC observability combining logging and
  tracing
- Added `createObserver()` factory function for creating observer instances
- Added `REQUEST_ATTRIBUTE_MAP` for standardized request attribute extraction
- Added `RESPONSE_ATTRIBUTE_MAP` for standardized response attribute extraction
- `Observer` automatically logs span events: `request.sent`,
  `response.received`, `request.received`, `response.sent`
- `Observer` handles all span lifecycle management and error handling for RPC
  operations
- Version bump to `0.2.0` for new exports and functionality

## 2025-10-27

- Removed `AsyncLocalStorage` dependency from `Tracer` and `Span` classes
- Updated `Tracer.startSpan()` to accept explicit `traceId` and `parentSpanId`
  parameters for cross-service trace propagation
- Updated `Span` constructor to accept `traceId` and `parentSpanId` instead of
  `parentSpan` object
- Removed `Tracer.getActiveSpan()` method as context is now passed explicitly
  via gRPC metadata
- Trace context now propagates between services via gRPC metadata headers
  (`x-trace-id`, `x-span-id`)

## 2025-10-26

- Created `@copilot-ld/libtelemetry` package for OpenTelemetry-based tracing
- Implemented `Tracer` class with `AsyncLocalStorage` for context propagation
- Implemented `Span` class with event tracking and gRPC client integration
- Added `createTracer(serviceName)` factory function with graceful degradation
- Defined semantic conventions in `constants.js` for span attributes
- Supports automatic parent-child span relationships via context
- Sends spans to trace service via `TraceClient` gRPC
