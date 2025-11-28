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
npm run cli:chat
> What are Docker security best practices?
> How do I implement rolling updates in Kubernetes?

# Semantic search testing
npm run cli:search
> docker security
> kubernetes deployment

# Graph query testing
npm run cli:query
> ? rdf:type schema:Person
> person:john ? ?

# Trace visualization with Mermaid diagrams
npm run cli:visualize
> [?kind==`2`]  # Show all SERVER spans
> [?contains(name, 'llm')]  # Show LLM-related operations
```

### Evaluation Utilities

The evaluation system assesses agent response quality using `LLM-as-a-judge`
methodology with a two-step workflow:

```bash
# Step 1: Run evaluations (stores results in data/eval/)
npm run eval

# Run with custom concurrency and iterations
npm run eval -- --concurrency 10 --iterations 3

# Step 2: Generate reports from stored results
npm run eval:report
```

**Evaluation System**:

- **Recall-focused metrics**: Each test case defines required facts that must
  appear in responses
- **100% recall requirement**: All test cases must achieve perfect recall to
  pass
- **Criteria-based evaluation**: Uses template-based prompts with structured
  verdict parsing
- **Memory integration**: Reports include full conversation context for each
  test case
- **Persistent storage**: Results stored in `EvaluationIndex` for incremental
  reporting

Test cases are defined in `config/eval.yml` based on the BioNova pharmaceutical
demo scenarios.

Reports are written to:

- `data/eval/SUMMARY.md` - Aggregate statistics across all test cases
- `data/eval/[case-id].md` - Detailed report for each individual test case

### Scripted Testing

```bash
# Pipe input for automated testing
echo "Tell me about container security" | npm run cli:chat

# Search with CLI flags for precise testing
echo "docker" | npm run cli:search -- --limit 10 --threshold 0.25
```

### System Validation Scripts

```bash
# Test embedding generation
echo "sample text" | npx env-cmd -- node scripts/embed.js

# Test cosine similarity search
echo "other text" | npx env-cmd -- node scripts/embed.js | node scripts/cosine.js
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

- **UI Extension**: `http://localhost:3000/ui/`
- **Documentation Server**: `npm run docs` serves on `http://localhost:8080`

## Trace Analysis

All system operations are automatically traced and stored in `data/traces/` as
daily JSONL files.

### Interactive Trace Visualization

The `visualize` CLI tool generates Mermaid sequence diagrams with JMESPath query
support:

```bash
# Launch interactive REPL
npm run cli:visualize

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
