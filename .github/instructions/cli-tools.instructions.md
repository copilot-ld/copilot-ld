---
applyTo: "**"
---

# CLI Tools

Platform CLI tools accept piped input: `echo "input" | make cli-<tool>`

## Tools

| Tool             | Purpose             | Usage                              |
| ---------------- | ------------------- | ---------------------------------- |
| `cli-chat`       | Agent conversations | `echo "query" \| make cli-chat`    |
| `cli-search`     | Vector search       | `echo "query" \| make cli-search`  |
| `cli-query`      | Graph queries       | `echo "s p o" \| make cli-query`   |
| `cli-subjects`   | List subjects       | `echo "type" \| make cli-subjects` |
| `cli-visualize`  | Trace visualization | `echo "[]" \| make cli-visualize`  |
| `cli-window`     | Memory window JSON  | `make cli-window ARGS="<id>"`      |
| `cli-completion` | LLM completion      | `... \| make cli-completion`       |

## Options

- **chat**: Clear state with `ARGS="--clear"` (separate step)
- **search**: `ARGS="--threshold 0.5 --limit 10"`
- **query**: Use `?` as wildcard: `echo "subject ? ?" | ...`
- **visualize**: `ARGS="--trace <id>"` or `ARGS="--resource <id>"`

## Workflow

```bash
echo "*" | make cli-subjects          # Discover entities
echo "prefix:entity ? ?" | make cli-query  # Explore relationships
echo "search terms" | make cli-search      # Search vectors
echo "question" | make cli-chat            # Test agent
```

## Prohibitions

1. **DO NOT** create wrappers around CLI tools—use them directly
2. **DO NOT** combine `--clear` with piped input for chat
