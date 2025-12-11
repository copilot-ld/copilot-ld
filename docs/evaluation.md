---
title: Evaluation Guide
description: |
  Guide to evaluating agent response quality using automated scenarios.
toc: true
---

## Overview

The evaluation system validates agent behavior through automated scenarios
defined in `config/eval.yml`. Each scenario sends a prompt to the agent and
evaluates the response against defined criteria.

## Running Evaluations

```bash
# Run all scenarios
npm run eval

# Run specific scenario
npm run eval -- --scenario search_drug_discovery_platform

# Run with concurrency and iterations
npm run eval -- --concurrency 5 --iterations 3

# Generate reports from stored results
npm run eval:report
```

Results are stored in `data/eval/` with per-scenario markdown reports and a
summary.

### Configuration

Configure eval behavior in `config/config.json`:

```json
{
  "evals": {
    "models": ["gpt-4o"],
    "judge_model": "gpt-5"
  }
}
```

- `models`: List of models to evaluate (matrix testing)
- `judge_model`: Model used for criteria/judge evaluations

## Scenario Types

### Criteria Evaluation

Validates response content using an LLM judge. The judge model is configured via
`evals.judge_model` in `config/config.json`. Each criterion is evaluated
independently.

```yaml
search_drug_discovery_platform:
  type: criteria
  prompt: |
    What is MolecularForge and what capabilities does it provide?
  evaluations:
    - label: Response identifies MolecularForge as chemistry platform
      data: |
        Response is identifying MolecularForge as a computational chemistry 
        platform for drug discovery and development.
    - label: Response describes core capabilities
      data: |
        Response is describing at least two core capabilities such as 
        structure-based docking or multi-target scoring.
```

### Recall Evaluation

Validates that specific resources are retrieved into context. All listed
subjects must be found.

```yaml
recall_drug_discovery_team:
  type: recall
  prompt: |
    Who are the members of the Drug Discovery Team?
  evaluations:
    - label: Retrieves Drug Discovery Team item
      data: https://bionova.example/id/org/drug-discovery-team
```

### Trace Evaluation

Validates tool execution patterns using JMESPath queries on trace spans.

```yaml
trace_search_execution:
  type: trace
  prompt: |
    Search for information about clinical trials
  evaluations:
    - label: Agent calls search tool
      data: "[?name==`tool.CallTool`]"
```

## Writing Scenarios

### Validation Workflow

Before writing a scenario, verify expected behavior:

```bash
# Check entity exists
echo "https://schema.org/Type" | npm -s run cli:subjects

# Explore relationships
echo "entity:name ? ?" | npm -s run cli:query

# Verify search retrieval
echo "query terms" | npm -s run cli:search

# Test agent response
echo "Your eval prompt" | npm -s run cli:chat
```

### Best Practices

- Ground scenarios in data from `examples/knowledge/`
- Use one evaluation type per scenario
- Write criteria that are specific and testable
- Include only essential subjects in recall scenarios
- Use scenario names that describe what is being tested

## Debugging Failures

Check retrieved context (replace `<resource-id>` with actual ID from eval
output):

```bash
cat data/memories/<resource-id>.jsonl | jq -c 'select(.identifier.subjects | length > 0) | .identifier.subjects'
```

Visualize trace spans:

```bash
echo "[]" | npm -s run cli:visualize -- --resource <resource-id>
```

Filter for specific operations:

```bash
echo "[?name==\`tool.CallTool\`]" | npm -s run cli:visualize -- --resource <resource-id>
```

## Related Documentation

- [Observability Guide](/observability/) – Understanding trace structure
- [Development Guide](/development/) – Local setup and testing workflows
