---
applyTo: "**"
---

# CLI Tools Instructions

Platform CLI tools for development, debugging, evaluation, and system
exploration. All tools accept piped input for automation.

## Principles

1. **Pipe-First Design**: All tools accept piped input for automated execution
2. **Stateless Execution**: Each command is self-contained (except chat state)
3. **Direct System Access**: Tools expose core platform capabilities without
   abstraction

## Requirements

### Available Tools

| Tool             | Purpose                      | Basic Usage                        |
| ---------------- | ---------------------------- | ---------------------------------- |
| `cli-chat`       | Agent conversations          | `echo "query" \| make cli-chat`    |
| `cli-search`     | Vector similarity search     | `echo "query" \| make cli-search`  |
| `cli-query`      | Graph triple pattern queries | `echo "s p o" \| make cli-query`   |
| `cli-subjects`   | List graph subjects by type  | `echo "type" \| make cli-subjects` |
| `cli-visualize`  | Trace visualization          | `echo "[]" \| make cli-visualize`  |
| `cli-window`     | Fetch memory window as JSON  | `make cli-window ARGS="<id>"`      |
| `cli-completion` | Send window to LLM API       | `... \| make cli-completion`       |

### Command Syntax

```bash
# Single input
echo "input" | make cli-<tool>

# Multi-line input (chat only)
printf "line1\nline2\n" | make cli-chat
```

### Tool-Specific Options

**chat**: Maintains conversation state across invocations. Clear with
`make cli-chat ARGS="--clear"` (separate step, exits immediately).

**search**: `ARGS="--threshold 0.5 --limit 10 --representation content"`

**query**: Triple patterns use `?` as wildcard: `echo "subject ? ?" | ...`

**subjects**: Empty input or `*` returns all; type URI filters results

**visualize**: `ARGS="--trace <id>"` or `ARGS="--resource <id>"`. JMESPath query
selects traces: `echo "[?contains(name, 'llm')]" | ...`

### Common Workflows

Discover entities → explore relationships → search → test agent:

```bash
echo "*" | make cli-subjects
echo "prefix:entity ? ?" | make cli-query
echo "search terms" | make cli-search
echo "natural language question" | make cli-chat
```

Discover traces → filter spans → visualize:

```bash
echo "[]" | make cli-visualize # All spans
echo '[?kind==`2`]' | make cli-visualize # SERVER spans
echo '[?kind==`3`]' | make cli-visualize # CLIENT spans
echo "[?contains(name, 'llm')]" | make cli-visualize # LLM spans
```

Debug memory windows → test LLM completions:

```bash
make cli-window ARGS="common.Conversation.<id>"  # Fetch window JSON
make cli-window ARGS="<id>" | make cli-completion  # Test completion
```

## Prohibitions

1. **DO NOT** create custom wrappers around CLI tools - use them directly
2. **DO NOT** assume tools are only for testing - they're primary development
   utilities
3. **DO NOT** combine `--clear` with piped input for chat - run as separate step
