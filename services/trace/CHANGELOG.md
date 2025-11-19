# Changelog

## 2025-11-18

- Bump version

## 2025-11-13

- **BREAKING**: Updated `QuerySpans` to support JMESPath query expressions for
  flexible trace filtering
- Simplified service implementation by moving span storage and querying logic to
  `TraceIndex`

## 2025-11-02

## 2025-10-28

- Updated `BufferedIndex` instantiation to use `config` parameter instead of
  inline options
- Configuration now uses `config.json` with `service.trace.flush_interval` and
  `service.trace.max_buffer_size`
- Removed environment variable parsing in favor of centralized config management

## 2025-10-26

- Created `TraceService` for receiving and storing trace spans via gRPC
- Implemented `RecordSpan`, `QuerySpans`, and `FlushTraces` RPC methods
- Uses `BufferedIndex` for high-volume span storage with periodic flushing
- Added stub OTLP exporter for future AWS X-Ray integration
- Configured service bootstrap with graceful shutdown handling
- Added Docker Compose configuration with internal network
- Stores traces in daily JSONL files (`data/traces/YYYY-MM-DD.jsonl`)
