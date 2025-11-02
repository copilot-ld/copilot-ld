# Changelog

## 2025-11-02

- Added `resource_id` field to `QuerySpansRequest` for querying spans by conversation/resource ID
- Updated `QuerySpans` to support querying by either `trace_id` OR `resource_id`
- When querying by `resource_id`, searches across all trace files and filters spans by matching resource_id
- Fixed span retrieval to directly iterate over index Map since spans are stored as raw objects
- Refactored `TraceService` to follow memory service pattern with per-trace-ID storage
- Constructor now accepts `StorageInterface` instead of pre-created `BufferedIndex`
- Maintains map of `BufferedIndex` instances per trace ID using `#getIndex()` helper
- Each trace ID gets its own `{traceId}.jsonl` file for isolated storage
- Updated `FlushTraces` to support flushing specific trace or all traces
- Simplified `server.js` bootstrap by removing date-based file naming logic

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
