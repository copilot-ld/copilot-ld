---
title: Observability Guide
description: |
  Guide to distributed tracing for debugging and monitoring agent behavior.
toc: true
---

## Overview

Every request generates a trace—a complete record of service calls, tool
executions, and decisions. Traces are stored in `data/traces/` as daily JSONL
files.

## Trace Structure

Traces consist of hierarchical spans:

```
agent.ProcessStream (SERVER)
├── llm.CreateCompletions (CLIENT → SERVER)
│   └── memory.GetWindow (CLIENT → SERVER)
├── tool.CallTool (CLIENT → SERVER)
│   └── vector.SearchContent (SERVER)
└── memory.AppendMemory (CLIENT → SERVER)
```

Each span includes trace ID, timestamps, attributes, events, and status.

## Accessing Traces

### CLI Visualization

```bash
# Launch visualization REPL
npm run cli:visualize

# Filter with JMESPath (kind: 2=SERVER, 3=CLIENT)
> [?kind==`2`]                        # SERVER spans
> [?contains(name, 'llm')]            # LLM operations
> [?contains(name, 'tool.CallTool')]  # Tool calls
```

Use `--trace <id>` for specific traces or `--resource <id>` for all traces in a
conversation.

### Direct File Access

```bash
# View recent traces
ls -t data/traces/*.jsonl | head -1 | xargs tail -n 1 | jq .span

# Find errors
cat data/traces/*.jsonl | jq 'select(.span.status.code == "ERROR") | .span'

# Count tool calls by function
cat data/traces/*.jsonl | jq -r '
  select(.span.name == "tool.CallTool") |
  .span.events[] | select(.name == "request.received") |
  .attributes.function_name
' | sort | uniq -c
```

## External Integration

The trace service supports OTLP export via `OTEL_EXPORTER_OTLP_ENDPOINT`
environment variable for integration with Jaeger, Grafana Tempo, or other
OpenTelemetry-compatible backends.

## Related Documentation

- [Evaluation Guide](/evaluation/) – Using traces for automated agent evaluation
- [Reference Guide](/reference/) – Technical details of the trace service
