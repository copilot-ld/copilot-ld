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

| Tool            | Purpose                      | Basic Usage                              |
| --------------- | ---------------------------- | ---------------------------------------- |
| `cli:chat`      | Agent conversations          | `echo "query" \| npm -s run cli:chat`    |
| `cli:search`    | Vector similarity search     | `echo "query" \| npm -s run cli:search`  |
| `cli:query`     | Graph triple pattern queries | `echo "s p o" \| npm -s run cli:query`   |
| `cli:subjects`  | List graph subjects by type  | `echo "type" \| npm -s run cli:subjects` |
| `cli:visualize` | Trace visualization          | `echo "[]" \| npm -s run cli:visualize`  |

### Command Syntax

```bash
# Single input
echo "input" | npm -s run cli:<tool>

# With options (use -- separator)
echo "input" | npm -s run cli:<tool> -- --option value

# Multi-line input (chat only)
printf "line1\nline2\n" | npm -s run cli:chat
```

### Tool-Specific Options

**chat**: Maintains conversation state across invocations. Clear with
`npm -s run cli:chat -- --clear` (separate step, exits immediately).

**search**: `--threshold <0.0-1.0>`, `--limit <n>`,
`--representation <content|descriptor>`

**query**: Triple patterns use `?` as wildcard: `echo "subject ? ?" | ...`

**subjects**: Empty input or `*` returns all; type URI filters results

**visualize**: `--trace <id>`, `--resource <id>`. JMESPath query selects traces:
`echo "[?contains(name, 'llm')]" | ...`

### Common Workflows

```bash
# Discover entities → explore relationships → search → test agent
echo "*" | npm -s run cli:subjects
echo "prefix:entity ? ?" | npm -s run cli:query
echo "search terms" | npm -s run cli:search
echo "natural language question" | npm -s run cli:chat
```

## Prohibitions

1. **DO NOT** create custom wrappers around CLI tools - use them directly
2. **DO NOT** assume tools are only for testing - they're primary development
   utilities
3. **DO NOT** combine `--clear` with piped input for chat - run as separate step
