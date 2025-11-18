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

- [Configuration Guide](/configuration/) - Environment setup and GitHub
  authentication
- [Processing Guide](/processing/) - Knowledge base processing (if using custom
  content)

## Development Workflow

By default all services run in development mode with debug logging enabled.

```bash
# Launch all services in development mode
npm run dev:start

# Stop development environment
npm run dev:stop

# Restart development environment
npm run dev:restart
```

## Testing and Validation

Run various testing and validation checks:

```bash
npm test
npm run test:watch
npm run perf
npm run check
npm run check:fix
```

Individual quality checks:

```bash
npm run lint
npm run format
npm run spellcheck
```

These run ESLint code analysis, Prettier formatting check, and spell check
documentation respectively.

### Security Auditing

Check for security vulnerabilities:

```bash
npm run security
```

## Development Scripts

The `scripts/` directory contains utilities for development and testing:

### Interactive Testing

```bash
# Interactive chat with the system
npm run chat
> What are Docker security best practices?
> How do I implement rolling updates in Kubernetes?

# Semantic search testing
npm run search
> docker security
> kubernetes deployment

# Graph query testing
npm run query
> ? rdf:type schema:Person
> person:john ? ?
```

### Evaluation Testing

The evaluation system assesses agent response quality using `LLM-as-a-judge`
methodology:

```bash
# Run full evaluation suite (default 5 parallel)
npm run eval

# Run with custom concurrency
npm run eval -- --concurrency 10

# Run specific test case
npm run eval -- --case vector_drug_formulation

# Generate report from existing results
npm run eval -- --report-only --input run-2025-10-23-001.json
```

**Evaluation Metrics** (0-10 scale):

- **Relevance**: Does the response address the user's question?
- **Accuracy**: Are the facts and information correct?
- **Completeness**: Does the response cover all aspects?
- **Coherence**: Is the response well-structured and organized?
- **Source Attribution**: Does the response properly cite sources?

Test cases are defined in `config/eval.yml` based on the BioNova pharmaceutical
demo scenarios in `eval/EVAL.md`.

Evaluation reports are written to:

- `data/evalresults/run-YYYY-MM-DD-XXX.md` - Human-readable markdown report
- `data/evalresults/run-YYYY-MM-DD-XXX.json` - Machine-readable JSON results

### Scripted Testing

```bash
# Pipe input for automated testing
echo "Tell me about container security" | npm run chat

# Search with CLI flags for precise testing
echo "docker" | npm run search -- --limit 10 --threshold 0.25
```

### System Validation Scripts

```bash
# Test vector embeddings and similarity
node scripts/cosine.js "first text" "second text"

# Validate model configurations
npx env-cmd -- node scripts/models.js

# Test embedding generation
echo "sample text" | npx env-cmd -- node scripts/embed.js
```

### Development Utilities

```bash
# Generate SSL certificates for HTTPS development
node scripts/cert.js

# Generate service authentication secrets
node scripts/secret.js

# GitHub token setup and validation
npx env-cmd -- node scripts/token.js
```

## Code Generation Workflow

For details about Protocol Buffer compilation and type generation, see the
[Code Generation](/architecture/) section in the Architecture Guide.

Generate all code from proto definitions:

```bash
mkdir generated
npm run codegen
```

Generate specific components:

```bash
npm run codegen:type
npm run codegen:client
npm run codegen:service
```

These generate type definitions only, client stubs only, and service bases only
respectively.

## Web Interface Testing

Access the development interfaces:

- **Web Extension**: `http://localhost:3000/web`
- **Documentation Server**: `npm run docs` serves on `http://localhost:8080`

## Trace Analysis

All system operations are automatically traced and stored in `data/traces/` as
daily JSONL files.

### Viewing Traces

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

### Common Trace Patterns

**Agent Request Trace**:

- Root span: `Agent.ProcessRequest`
- Child spans: `Memory.GetWindow`, `Llm.CreateEmbeddings`,
  `Vector.QueryByContent`, `Tool.CallTool`, etc.

**Tool Execution Chain**:

- Root span: `Tool.CallTool`
- May have nested `Tool.CallTool` spans for recursive tool execution

**Vector Search**:

- `Llm.CreateEmbeddings` (generate query vector)
- `Vector.SearchContent` (similarity search)

For detailed tracing implementation, see the [Reference Guide](/reference/).
