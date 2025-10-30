---
title: Observability Guide
description: |
  Practical guide for operators to leverage Copilot-LD's distributed tracing
  system in production. Covers trace analysis, integration with external tools,
  performance monitoring, and troubleshooting workflows.
toc: true
---

## Overview

Copilot-LD includes comprehensive distributed tracing that records every service
call, tool execution, and decision made by the agent. This guide shows
production operators how to use traces for monitoring, debugging, and
optimization.

## Understanding Traces

### What Gets Traced

Every request through the system generates a trace—a complete record of all
operations performed to handle that request:

- **Service Calls**: Every gRPC call between services (Agent → Memory, Agent →
  LLM, etc.)
- **Tool Executions**: All tool calls including parameters and results
- **Resource Access**: Vector searches, graph queries, and memory retrievals
- **Timing Information**: Nanosecond-precision timestamps for performance
  analysis
- **Metadata**: Message counts, token usage, resource IDs, conversation context

### Trace Structure

A trace consists of spans arranged in a hierarchical tree:

```
agent.ProcessRequest (SERVER)
├── memory.GetWindow (CLIENT)
│   └── memory.GetWindow (SERVER)
├── llm.CreateCompletions (CLIENT)
│   └── llm.CreateCompletions (SERVER)
├── tool.CallTool (CLIENT)
│   └── tool.CallTool (SERVER)
│       └── vector.QueryByDescriptor (SERVER)
│           └── llm.CreateEmbeddings (CLIENT)
│               └── llm.CreateEmbeddings (SERVER)
└── memory.AppendMemory (CLIENT)
    └── memory.AppendMemory (SERVER)
```

Each span includes:

- **Trace ID**: Shared by all spans in the request
- **Span ID**: Unique identifier for this operation
- **Parent Span ID**: Links to parent operation
- **Timestamps**: Start and end time in nanoseconds
- **Attributes**: Structured metadata about the operation
- **Events**: Point-in-time markers (request.sent, response.received)
- **Status**: Success (OK) or failure (ERROR)

## Accessing Traces

### Local File Access

Traces are stored in `data/traces/` with daily rotation:

```bash
# View today's traces
cat data/traces/2025-10-29.jsonl

# Format a single trace for readability
tail -n 1 data/traces/2025-10-29.jsonl | jq .

# Count traces by service
cat data/traces/2025-10-29.jsonl | jq -r '.attributes."service.name"' | sort | uniq -c

# Find traces with errors
cat data/traces/2025-10-29.jsonl | jq 'select(.status.code == "STATUS_CODE_ERROR")'
```

### Common Analysis Patterns

**Find All Spans for a Trace**:

```bash
# Get all spans with specific trace_id
TRACE_ID="f6a4a4d0d3e91"
cat data/traces/2025-10-29.jsonl | jq "select(.trace_id == \"$TRACE_ID\")"
```

**Analyze Performance**:

```bash
# Calculate span durations (requires bc)
cat data/traces/2025-10-29.jsonl | jq -r '
  (.end_time_unix_nano.high * 4294967296 + .end_time_unix_nano.low) -
  (.start_time_unix_nano.high * 4294967296 + .start_time_unix_nano.low)
  | . / 1000000 | "\(.name): \(.) ms"
' | head -n 10

# Find slowest operations
cat data/traces/2025-10-29.jsonl | jq -r '
  (.end_time_unix_nano.high * 4294967296 + .end_time_unix_nano.low) -
  (.start_time_unix_nano.high * 4294967296 + .start_time_unix_nano.low)
  | { name: .name, duration_ms: (. / 1000000) }
' | jq -s 'sort_by(.duration_ms) | reverse | .[:10]'
```

**Extract Token Usage**:

```bash
# Get total token usage by conversation
cat data/traces/2025-10-29.jsonl | jq -r '
  select(.events[].attributes."response.usage.total_tokens") |
  {
    conversation: .events[].attributes."resource.id",
    tokens: .events[].attributes."response.usage.total_tokens"
  }
'
```

**Find Tool Executions**:

```bash
# See which tools were called and how often
cat data/traces/2025-10-29.jsonl | jq -r '
  select(.name == "tool.CallTool") |
  .events[].attributes."request.function.name"
' | sort | uniq -c | sort -nr
```

## External Tool Integration

### Jaeger

Jaeger provides a powerful UI for trace visualization and analysis.

**Setup with Docker Compose**:

Add Jaeger to your `docker-compose.yml` with OTLP collection enabled. The UI
will be available on port 16686 and OTLP HTTP endpoint on port 4318:

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"
      - "4318:4318"
    networks:
      - backend

  trace:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
```

**Enable Export**:

The trace service includes a stub OTLP exporter. To implement actual export,
modify `services/trace/exporter.js`:

```javascript
/* eslint-env node */
/* eslint-disable no-undef */
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

export function createOTLPExporter(config) {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return null;

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  return {
    async export(span) {
      await exporter.export([convertToOTLP(span)]);
    },
    async shutdown() {
      await exporter.shutdown();
    },
  };
}
```

**Querying Traces in Jaeger**:

- Navigate to `http://localhost:16686`
- Select service: `agent`, `memory`, `llm`, etc.
- Filter by operation: `ProcessRequest`, `CreateCompletions`, etc.
- Search by tags: `resource.id`, `request.function.name`
- View trace timelines with service dependencies

### Grafana Tempo

Tempo is designed for high-volume trace storage and integrates well with
Grafana.

**Setup with Docker Compose**:

```yaml
services:
  tempo:
    image: grafana/tempo:latest
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
      - tempo-data:/var/tempo
    ports:
      - "4318:4318" # OTLP HTTP
    networks:
      - backend

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - backend

volumes:
  tempo-data:
  grafana-data:
```

**Tempo Configuration** (`tempo.yaml`):

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces
```

**Grafana Configuration**:

1. Add Tempo data source: `http://tempo:3200`
2. Create dashboard for trace metrics
3. Use TraceQL for advanced queries
4. Set up alerts for error rates or latency

### AWS X-Ray

For AWS deployments, export traces to X-Ray for integrated CloudWatch
monitoring.

**Setup**:

```javascript
/* eslint-env node */
// services/trace/exporter.js
import { XRayClient, PutTraceSegmentsCommand } from "@aws-sdk/client-xray";

export function createOTLPExporter(config) {
  const region = process.env.AWS_REGION;
  if (!region) return null;

  const xray = new XRayClient({ region });

  return {
    async export(span) {
      const segment = convertToXRay(span);
      await xray.send(new PutTraceSegmentsCommand(segment));
    },
    async shutdown() {
      // No cleanup needed for AWS SDK client
    },
  };
}

function convertToXRay(span) {
  return {
    TraceDocumentList: [
      {
        id: span.span_id,
        trace_id: span.trace_id,
        parent_id: span.parent_span_id,
        name: span.name,
        start_time: Number(span.start_time_unix_nano) / 1e9,
        end_time: Number(span.end_time_unix_nano) / 1e9,
        annotations: span.attributes,
      },
    ],
  };
}
```

**CloudWatch Integration**:

- View traces in X-Ray console
- Create CloudWatch dashboards with trace metrics
- Set up alarms for error rates or p99 latency
- Use X-Ray Service Map for dependency visualization

### Datadog

Datadog provides end-to-end observability with APM, logs, and metrics.

**Setup**:

```yaml
services:
  datadog-agent:
    image: gcr.io/datadoghq/agent:latest
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=datadoghq.com
      - DD_APM_ENABLED=true
      - DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT=0.0.0.0:4318
    ports:
      - "4318:4318"
    networks:
      - backend

  trace:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://datadog-agent:4318
```

**Benefits**:

- Automatic service map generation
- Built-in anomaly detection
- Correlation with logs and metrics
- Real-time alerting and dashboards

## Production Monitoring

### Key Metrics to Track

**Request Performance**:

- **p50, p95, p99 Latency**: Percentile distribution of request durations
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests

**Service Health**:

- **LLM Service Latency**: Track external API call durations
- **Vector Search Performance**: Monitor query execution times
- **Memory Service Load**: Track conversation storage operations

**Agent Behavior**:

- **Tool Call Frequency**: Which tools are used most often
- **Token Usage**: LLM consumption by conversation
- **Tool Call Success Rate**: Percentage of successful tool executions

### Creating Dashboards

**Grafana Dashboard Example**:

```json
{
  "dashboard": {
    "title": "Copilot-LD Operations",
    "panels": [
      {
        "title": "Request Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(trace_duration_ms[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(trace_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Token Usage by Conversation",
        "targets": [
          {
            "expr": "sum by (resource_id) (trace_tokens_total)"
          }
        ]
      }
    ]
  }
}
```

### Alert Configuration

**High Error Rate**:

```yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 0.05
    duration: 5m
    severity: critical
    message: "Error rate above 5% for 5 minutes"
```

**High Latency**:

```yaml
alerts:
  - name: high_p99_latency
    condition: p99_latency > 10000ms
    duration: 5m
    severity: warning
    message: "p99 latency above 10 seconds"
```

**LLM Service Failures**:

```yaml
alerts:
  - name: llm_service_failures
    condition: llm_error_rate > 0.01
    duration: 2m
    severity: critical
    message: "LLM service experiencing failures"
```

## Troubleshooting Workflows

### Slow Requests

**Step 1: Identify Slow Traces**

```bash
# Find traces with duration > 10 seconds
cat data/traces/2025-10-29.jsonl | jq -r '
  select(.name == "agent.ProcessRequest") |
  select(
    ((.end_time_unix_nano.high * 4294967296 + .end_time_unix_nano.low) -
     (.start_time_unix_nano.high * 4294967296 + .start_time_unix_nano.low))
    / 1000000000 > 10
  ) |
  .trace_id
'
```

**Step 2: Analyze Trace Tree**

```bash
# Get all spans for slow trace
TRACE_ID="<identified-trace-id>"
cat data/traces/2025-10-29.jsonl | jq "select(.trace_id == \"$TRACE_ID\")"
```

**Step 3: Identify Bottleneck**

Look for:

- Long-running LLM completions (check token counts)
- Multiple tool call iterations
- Large vector search result sets
- Memory service contention

**Step 4: Optimize**

- Reduce token budgets if LLM calls are slow
- Adjust vector search thresholds to return fewer results
- Cache frequently accessed resources
- Review tool implementations for efficiency

### Failed Requests

**Step 1: Find Error Spans**

```bash
# Find all error spans
cat data/traces/2025-10-29.jsonl | jq '
  select(.status.code == "STATUS_CODE_ERROR")
'
```

**Step 2: Examine Error Context**

```bash
# Get full trace for error
ERROR_TRACE_ID="<error-trace-id>"
cat data/traces/2025-10-29.jsonl | jq "
  select(.trace_id == \"$ERROR_TRACE_ID\")
" | jq -s 'sort_by(.start_time_unix_nano.high, .start_time_unix_nano.low)'
```

**Step 3: Identify Root Cause**

Check:

- Which service failed (look at `service.name` attribute)
- Error message in span status
- Request parameters that triggered the error
- Parent spans to understand context

**Step 4: Remediate**

- Fix service implementation if bug identified
- Adjust configuration if resource limits hit
- Review input validation if bad data caused error
- Scale service if capacity issue detected

### Tool Execution Issues

**Step 1: Find Tool Call Traces**

```bash
# Find all tool calls for specific function
TOOL_NAME="query_by_descriptor"
cat data/traces/2025-10-29.jsonl | jq "
  select(.name == \"tool.CallTool\") |
  select(.events[].attributes.\"request.function.name\" == \"$TOOL_NAME\")
"
```

**Step 2: Analyze Tool Performance**

```bash
# Calculate average duration for tool
cat data/traces/2025-10-29.jsonl | jq -r "
  select(.name == \"tool.CallTool\") |
  select(.events[].attributes.\"request.function.name\" == \"$TOOL_NAME\") |
  ((.end_time_unix_nano.high * 4294967296 + .end_time_unix_nano.low) -
   (.start_time_unix_nano.high * 4294967296 + .start_time_unix_nano.low))
  / 1000000
" | awk '{ sum += $1; n++ } END { if (n > 0) print sum / n }'
```

**Step 3: Review Tool Parameters**

```bash
# Check parameters used in tool calls
cat data/traces/2025-10-29.jsonl | jq '
  select(.name == "tool.CallTool") |
  .events[] | select(.name == "request.sent") | .attributes
'
```

**Step 4: Optimize Tool Usage**

- Adjust filter parameters (threshold, limit, max_tokens)
- Review tool prompt engineering if LLM not calling tools correctly
- Consider caching for frequently called tools with same parameters
- Implement result streaming for large result sets

### Memory Pressure

**Step 1: Track Token Usage**

```bash
# Sum token usage by conversation
cat data/traces/2025-10-29.jsonl | jq -r '
  select(.events[].attributes."response.usage.total_tokens") |
  {
    conversation: .events[].attributes."resource.id",
    tokens: (.events[].attributes."response.usage.total_tokens" | tonumber)
  }
' | jq -s 'group_by(.conversation) | map({ conversation: .[0].conversation, total_tokens: map(.tokens) | add })'
```

**Step 2: Identify High-Usage Conversations**

Look for conversations consuming excessive tokens:

- Long conversation histories
- Large tool result sets
- Many resource retrievals

**Step 3: Adjust Budget Allocation**

Review `config/assistants.yml`:

```yaml
assistants:
  - id: default
    budget:
      tokens: 100000 # Adjust based on usage patterns
      tools_percent: 0.3
      resources_percent: 0.5
```

**Step 4: Implement Conversation Pruning**

Consider adding conversation history limits:

- Maximum message count per conversation
- Token budget per conversation lifetime
- Automatic archival of old conversations

## Best Practices

### Retention Policies

**Local Storage**:

```bash
# Rotate traces older than 30 days
find data/traces -name "*.jsonl" -mtime +30 -delete

# Compress old traces
find data/traces -name "*.jsonl" -mtime +7 -exec gzip {} \;
```

**S3 Storage** (if using AWS):

```bash
# Upload to S3 with lifecycle policy
aws s3 cp data/traces/ s3://copilot-ld-traces/ --recursive
```

Create S3 lifecycle policy:

```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

### Sampling Strategies

For high-volume production systems, implement sampling:

```javascript
/* eslint-env node */
// services/trace/index.js - RecordSpan method implementation
function recordSpanWithSampling(req, config, traceIndex) {
  const span = req;
  const sampleRate = config.sample_rate || 1.0;
  if (Math.random() > sampleRate) {
    return { success: true };
  }

  // Normal recording
  traceIndex.add(span);
  return { success: true };
}
```

Configure per service in `config/config.json`:

```json
{
  "services": {
    "trace": {
      "sample_rate": 0.1
    }
  }
}
```

### Privacy Considerations

**Remove Sensitive Data**:

```javascript
/* eslint-env node */
// Sanitize spans before storage
function sanitizeSpan(span) {
  // Remove user input from attributes
  if (span.attributes["request.text"]) {
    span.attributes["request.text"] = "[REDACTED]";
  }

  // Remove message content from events
  span.events = span.events.map((event) => {
    if (event.attributes["message.content"]) {
      event.attributes["message.content"] = "[REDACTED]";
    }
    return event;
  });

  return span;
}
```

**Access Control**:

Restrict trace file access to authorized operators:

```bash
# Set restrictive permissions
chmod 600 data/traces/*.jsonl
chown operator:operator data/traces/*.jsonl
```

### Performance Tuning

**Buffering Configuration**:

Adjust trace service buffer settings based on load:

```json
{
  "services": {
    "trace": {
      "flush_interval": 5000,
      "max_buffer_size": 1000
    }
  }
}
```

**Async Recording**:

The trace service uses buffered writes for efficiency. Monitor buffer flush
frequency:

```bash
# Check trace service logs
DEBUG=trace:* npm run dev
```

Look for frequent flushes indicating buffer saturation.

## Summary

Distributed tracing provides complete visibility into agent behavior in
production. By following this guide, operators can:

- Understand request flows through the microservices architecture
- Identify performance bottlenecks and optimize critical paths
- Debug failures with complete context across service boundaries
- Monitor agent decision-making patterns over time
- Integrate with industry-standard observability platforms
- Establish effective alerting and incident response workflows

For more information:

- [Concepts Guide](/concepts/) – Understanding why tracing is essential for
  agentic systems
- [Reference Guide](/reference/) – Technical details of the libtelemetry package
  and OpenTelemetry compatibility
