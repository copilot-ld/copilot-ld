---
applyTo: "**/config/eval.*"
---

# Evaluation Instructions

Defines standards for agent evaluations in `config/eval.yml` that validate
response quality, context retrieval, and tool execution.

1. **Ground in Reality**: Evaluate only data from `examples/knowledge/`—verify
   existence with CLI tools before writing evals
2. **One Eval Type Per Case**: Use criteria for response quality, recall for
   context retrieval, or trace for tool execution
3. **Validate Before Writing**: Run `cli:chat`, `cli:search`, `cli:subjects` to
   confirm expected behavior before codifying evals
4. **Debug with Artifacts**: Every eval captures conversation ID, memory, and
   traces—use them when evals fail

## Requirements

### Eval Types

**Criteria evals** validate response content:

```yaml
eval_name:
  prompt: "What is the platform used for?"
  criteria: "Response must mention X, Y, or Z"
```

**Recall evals** validate context retrieval (all subjects must be found):

```yaml
eval_name:
  prompt: "Tell me about entity X"
  true_subjects:
    - "https://example.org/id/entity/x"
    - "https://example.org/id/entity/x-related"
```

**Trace evals** validate tool execution via JMESPath:

```yaml
eval_name:
  prompt: "Query about topic"
  trace_checks:
    - '[?name==`tool.CallTool` &&
      events[0].attributes."function.name"==`tool_name`]'
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
cat data/memories/common.Conversation.ID.jsonl | jq -c '.identifier.subject'

# Visualize trace spans
echo "[]" | npm -s run cli:visualize -- --resource common.Conversation.ID

# Filter for tool calls
echo "[?name==\`tool.CallTool\`]" | npm -s run cli:visualize -- --resource common.Conversation.ID
```

### Running Evals

```bash
npm run eval                    # All evals
npm run eval -- --case name     # Specific eval
npm run eval -- --concurrency 3 # Parallel execution
```

## Explicit Prohibitions

### Forbidden Test Patterns

1. **DO NOT** create evals for data not in `examples/knowledge/`
2. **DO NOT** write vague criteria that pass with any response
3. **DO NOT** ignore failed evals—debug using captured artifacts
4. **DO NOT** include non-essential subjects in `true_subjects`
5. **DO NOT** skip CLI validation before writing evals
