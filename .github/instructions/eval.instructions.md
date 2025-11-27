---
applyTo: "**/config/eval.*"
---

# Evaluation Test Instructions

Defines standards for agent evaluation tests in `config/eval.yml` that validate
response quality, context retrieval, and tool execution.

## Principles

1. **Ground in Reality**: Test only data from `examples/knowledge/`—verify
   existence with CLI tools before writing tests
2. **One Test Type Per Case**: Use criteria for response quality, recall for
   context retrieval, or trace for tool execution
3. **Validate Before Writing**: Run `cli:chat`, `cli:search`, `cli:subjects` to
   confirm expected behavior before codifying tests
4. **Debug with Artifacts**: Every test captures conversation ID, memory, and
   traces—use them when tests fail

## Requirements

### Test Types

**Criteria tests** validate response content:

```yaml
test_name:
  prompt: "What is the platform used for?"
  criteria: "Response must mention X, Y, or Z"
```

**Recall tests** validate context retrieval (all subjects must be found):

```yaml
test_name:
  prompt: "Tell me about entity X"
  true_subjects:
    - "https://example.org/id/entity/x"
    - "https://example.org/id/entity/x-related"
```

**Trace tests** validate tool execution via JMESPath:

```yaml
test_name:
  prompt: "Query about topic"
  trace_checks:
    - '[?name==`tool.CallTool` &&
      events[0].attributes."function.name"==`tool_name`]'
```

### Development Workflow

```bash
# 1. Verify entity exists
echo "https://schema.org/Type" | npm -s run cli:subjects

# 2. Explore relationships
echo "entity:name ? ?" | npm -s run cli:query

# 3. Test search retrieval
echo "query terms" | npm -s run cli:search

# 4. Validate agent response
echo "Your test prompt" | npm -s run cli:chat

# 5. Write test based on observed behavior
```

### Debugging Failed Tests

```bash
# Check retrieved subjects from memory
cat data/memories/common.Conversation.ID.jsonl | jq -c '.identifier.subject'

# Visualize trace spans
echo "[]" | npm -s run cli:visualize -- --resource common.Conversation.ID

# Filter for tool calls
echo "[?name==\`tool.CallTool\`]" | npm -s run cli:visualize -- --resource common.Conversation.ID
```

### Running Tests

```bash
npm run eval                    # All tests
npm run eval -- --case name     # Specific test
npm run eval -- --concurrency 3 # Parallel execution
```

## Prohibitions

1. **DO NOT** create tests for data not in `examples/knowledge/`
2. **DO NOT** write vague criteria that pass with any response
3. **DO NOT** ignore failed tests—debug using captured artifacts
4. **DO NOT** include non-essential subjects in `true_subjects`
5. **DO NOT** skip CLI validation before writing tests
