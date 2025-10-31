# Changelog

## 2025-10-31

- Updated `server.js` to include logging and tracing initialization following
  current service patterns
- Added `createLogger` and `createTracer` imports from
  `@copilot-ld/libtelemetry` and `@copilot-ld/librpc`
- Pass `logger` and `tracer` to `Server` constructor for observability

## 2025-09-22

- Fixed Dockerfile to inherit from `copilot-ld/base:latest` to provide access to
  `@copilot-ld/*` packages
- Resolved module import errors for generated service dependencies
