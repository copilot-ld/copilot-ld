---
title: Development Guide
description: |
  This guide focuses on local development, testing, and validation workflows
  for Copilot-LD. For initial setup and configuration, see the Configuration
  Guide. For knowledge base processing, see the Processing Guide.
toc: true
---

## Prerequisites

Complete the initial setup steps:

- [Configuration Guide](/configuration/) - Environment setup and GitHub Models
  authentication
- [Processing Guide](/processing/) - Knowledge base processing (if using custom
  content)

## Development Workflow

By default all services run in development mode with debug logging enabled.

```bash
# Launch all services in development mode
make rc-start

# Control service lifecycle
make rc-stop
make rc-restart
make rc-status
```

## Testing and Validation

Run various testing and validation checks:

```bash
make test
make test-watch
make check
make check-fix
```

Individual quality checks:

```bash
make lint
make format
make spellcheck
```

These run ESLint code analysis, Prettier formatting check, and spell check
documentation respectively.

### Security Auditing

Check for security vulnerabilities:

```bash
make security
```

## Development Scripts

The `scripts/` directory contains utilities for development and testing:

### Interactive Testing

```bash
# Interactive chat with the system
make cli-chat
> What are Docker security best practices?
> How do I implement rolling updates in Kubernetes?

# Semantic search testing
make cli-search
> docker security
> kubernetes deployment

# Graph query testing
make cli-query
> ? rdf:type schema:Person
> person:john ? ?

# Trace visualization with Mermaid diagrams
make cli-visualize
> [?kind==`2`]  # Show all SERVER spans
> [?contains(name, 'llm')]  # Show LLM-related operations
```

### Evaluation Utilities

The evaluation system assesses agent response quality using `LLM-as-a-judge`
methodology with a two-step workflow:

```bash
# Step 1: Run evaluations (stores results in data/eval/)
make eval

# Step 2: Generate reports from stored results
make eval-report
```

**Evaluation System**:

- **Recall-focused metrics**: Each scenario defines required facts that must
  appear in responses
- **100% recall requirement**: All scenarios must achieve perfect recall to pass
- **Criteria-based evaluation**: Uses template-based prompts with structured
  verdict parsing
- **Memory integration**: Reports include full conversation context for each
  scenario
- **Persistent storage**: Results stored in `EvaluationIndex` for incremental
  reporting

Scenarios are defined in `config/eval.yml` based on the BioNova pharmaceutical
demo data.

Reports are written to:

- `data/eval/SUMMARY.md` - Aggregate statistics across all scenarios
- `data/eval/[scenario].md` - Detailed report for each individual scenario

### Scripted Testing

```bash
# Pipe input for automated testing
echo "Tell me about container security" | make cli-chat

# Search with piped input
echo "docker" | make cli-search
```

### System Validation Scripts

```bash
# Test embedding generation
make cli-embed < <(echo "sample text")

# Test cosine similarity search
make cli-embed < <(echo "other text") | make cli-cosine
```

### Development Utilities

```bash
# Generate SSL certificates for HTTPS development
make cert

# Full environment setup (tokens, secrets, certificates)
make env-setup
```

## Code Generation Workflow

For details about Protocol Buffer compilation and type generation, see the
[Code Generation](/architecture/) section in the Architecture Guide.

Generate all code from proto definitions:

```bash
make init
make codegen
```

Generate specific components:

```bash
make codegen-type
make codegen-client
make codegen-service
```

These generate type definitions only, client stubs only, and service bases only
respectively.

## Web Interface Testing

Access the development interfaces:

- **UI Extension**: `http://localhost:3000/ui/`
- **Documentation Server**: `make docs` serves on `http://localhost:8080`

## Trace Analysis

All system operations are automatically traced and stored in `data/traces/` as
daily JSONL files.

### Interactive Trace Visualization

The `visualize` CLI tool generates Mermaid sequence diagrams with JMESPath query
support:

```bash
# Launch interactive REPL
make cli-visualize

# Query traces with JMESPath expressions
> [?kind==`2`]  # All SERVER spans
> [?contains(name, 'llm')]  # LLM operations

# Filter by trace or resource ID
> /trace f6a4a4d0d3e91
> /resource common.Conversation.abc123
```

Visualization output shows:

- Service interaction sequence with timing
- Request/response attributes
- Error status and messages
- Complete trace context with all service calls

### Viewing Raw Traces

```bash
# View today's traces
cat data/traces/$(date +%Y-%m-%d).jsonl | jq

# Count spans by operation type
cat data/traces/*.jsonl | jq -r '.name' | sort | uniq -c

# Count spans by service
cat data/traces/*.jsonl | jq -r '.attributes["service.name"]' | sort | uniq -c

# Find all spans for a specific trace ID
cat data/traces/*.jsonl | jq 'select(.trace_id == "TRACE_ID_HERE")'

# Find error spans
cat data/traces/*.jsonl | jq 'select(.status.message != "")'
```

### Analyzing Request Flows

```bash
# Find traces with most spans (complex operations)
cat data/traces/*.jsonl | jq -r '.trace_id' | sort | uniq -c | sort -rn | head

# Analyze trace depth (parent-child nesting)
cat data/traces/*.jsonl | \
  jq -r '{trace_id, name, parent: .parent_span_id}' | \
  jq -s 'group_by(.trace_id) | map({trace: .[0].trace_id, depth: length})'
```
