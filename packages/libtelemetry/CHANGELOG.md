# Changelog

## 2025-11-02

- Added `TraceVisualizer` class for creating Mermaid sequence diagram visualizations of traces
- Added `traceviz` binary at `bin/traceviz.js` for visualizing traces by `trace_id` or `resource_id`
- Added `@copilot-ld/libformat` as devDependency for terminal markdown formatting
- Added `--markdown` option to `traceviz` binary for plain markdown output without terminal formatting
- Exported `TraceVisualizer` from main `index.js` for programmatic use
- Visualizations output standard Mermaid sequence diagrams showing service interactions
- Multiple traces for same resource_id are combined into single diagram with note separators between requests
- Binary uses `TerminalFormatter` to render markdown output with ANSI formatting by default
- Binary temporarily suppresses stderr during formatting to hide marked-terminal warnings
- Reduced cognitive load by focusing on service-to-service call sequences without span attributes
- **BREAKING**: `Tracer` constructor now requires `grpcMetadata` parameter (gRPC Metadata class) for dependency injection
- **BREAKING**: `Tracer.startClientSpan()` now returns `{span, metadata}` object instead of just span
- **BREAKING**: `Observer.observeClientCall()` no longer accepts `metadataFn` parameter - metadata is created by Tracer
- Made `Tracer.getMetadata()` and `Tracer.setMetadata()` private (`#getMetadata`, `#setMetadata`) as they are implementation details
- Tracer now fully owns metadata creation and trace context propagation for client calls
- Simplified Observer interface by removing metadata factory pattern
- Fixed trace context propagation in `Observer.observeClientCall()` to accept `metadataFactory` parameter
- gRPC metadata is now created before starting client span to ensure trace context is properly set
- Updated `observeClientCall()` to pass populated metadata to `callFn` instead of null
- All spans in a request trace now share the same trace_id and proper parent_span_id relationships

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
