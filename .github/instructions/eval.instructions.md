---
applyTo: "**/config/eval.*"
---

# Evaluation Instructions

Defines standards for agent evaluations in `config/eval.yml` that validate
response quality, context retrieval, and tool execution.

## Principles

1. **Ground in Reality**: Evaluate only data from `examples/knowledge/`—verify
   existence with CLI tools before writing evals
2. **One Eval Type Per Case**: Use judge for response quality, recall for
   context retrieval, or trace for tool execution
3. **Validate Before Writing**: Run `cli:chat`, `cli:search`, `cli:subjects` to
   confirm expected behavior before codifying evals
4. **Debug with Artifacts**: Every eval captures resource ID, memory, and
   traces—use them when evals fail

## Requirements

### Eval Types

**Judge evals** validate response content via LLM evaluation:

```yaml
- name: eval_name
  type: judge
  complexity: medium
  rationale: |
    Description of what this eval tests and why
  prompt: "What is the platform used for?"
  evaluations:
    - label: Response identifies key capability
      data: |
        Response is identifying X capability and explaining Y context.
```

**Recall evals** validate context retrieval (all subjects must be found):

```yaml
- name: eval_name
  type: recall
  complexity: low
  rationale: |
    Description of what this eval tests
  prompt: "Tell me about entity X"
  evaluations:
    - label: Retrieves entity X item
      data: https://example.org/id/entity/x
    - label: Retrieves related entity item
      data: https://example.org/id/entity/x-related
```

**Trace evals** validate tool execution via JMESPath:

```yaml
- name: eval_name
  type: trace
  complexity: medium
  rationale: |
    Description of what this eval tests
  prompt: "Query about topic"
  evaluations:
    - label: Agent calls expected tool
      data:
        "[?name==`tool.CallTool` &&
        events[0].attributes.function_name==`tool_name`]"
```

### Writing New Evals

```bash
# 1. Verify entity exists
echo "https://schema.org/Type" | npm -s run cli:subjects

# 2. Explore relationships
echo "entity:name ? ?" | npm -s run cli:query

# 3. Verify search retrieval
echo "query terms" | npm -s run cli:search

# 4. Validate agent response
echo "Your eval prompt" | npm -s run cli:chat

# 5. Write eval based on observed behavior
```

### Debugging Failed Evals

```bash
# Check retrieved subjects from memory
cat data/memories/common.Conversation.RESOURCE_ID.jsonl | jq -c '.subjects'

# Visualize trace spans
echo "[]" | npm -s run cli:visualize -- --resource common.Conversation.RESOURCE_ID

# Filter for tool calls
echo "[?name==\`tool.CallTool\`]" | npm -s run cli:visualize -- --resource common.Conversation.RESOURCE_ID
```

### Running Evals

```bash
npm run eval                           # All evals
npm run eval -- --scenario name        # Specific eval
npm run eval -- --concurrency 3        # Parallel execution
npm run eval:report                    # Generate report from results
```

### Reset Eval Results

```bash
npm run eval:reset                     # Reset all eval results
```

## Prohibitions

1. **DO NOT** create evals for data not in `examples/knowledge/`
2. **DO NOT** write vague evaluation data that passes with any response
3. **DO NOT** ignore failed evals—debug using captured artifacts
4. **DO NOT** include non-essential subjects in recall evaluations
5. **DO NOT** skip CLI validation before writing evals
6. **DO NOT** omit `type`, `complexity`, or `rationale` fields in eval scenarios
