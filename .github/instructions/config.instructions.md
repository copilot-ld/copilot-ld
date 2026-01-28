---
applyTo: "**/config/**"
---

# Config Instructions

Rules for managing configuration files and agent definitions. Every config file
has an example counterpart that must stay synchronized.

## Principles

1. **Clean Breaks Only**: No backward compatibility, no deprecation periods, no
   legacy config formats
2. **Example Parity**: Every config file has an `.example` counterpart that must
   stay in sync
3. **Secrets Stay Local**: Example files never contain real credentials, API
   keys, or environment-specific values
4. **Agent Clarity**: Agent definitions are behavioral contracts—clear,
   actionable, and testable

## Requirements

### File Pairing

When modifying any config file, update its example counterpart:

| Config File   | Example File          |
| ------------- | --------------------- |
| `config.json` | `config.example.json` |
| `tools.yml`   | `tools.example.yml`   |
| `eval.yml`    | `eval.example.yml`    |
| `ingest.yml`  | `ingest.example.yml`  |
| `*.agent.md`  | `*.agent.example.md`  |

### Agent File Structure

Agent files use YAML frontmatter followed by Markdown instructions:

```markdown
---
name: agent_name
description: One-line summary of the agent's purpose.
infer: true|false
tools:
  - tool_name
handoffs:
  - label: target_agent
    agent: target_agent
    prompt: |
      Context for the handoff.
---

# Agent Name

[Role statement and instructions]
```

### Agent Frontmatter Fields

| Field         | Required | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `name`        | Yes      | Unique identifier (snake_case)            |
| `description` | Yes      | One-line summary for tool descriptions    |
| `infer`       | Yes      | Whether to enable inference mode          |
| `tools`       | Yes      | List of available tool names              |
| `handoffs`    | No       | List of agents this agent can hand off to |

### Agent Content Sections

Structure agent instructions with these sections:

1. **Role Statement**: One sentence defining expertise and scope
   - "You are a [role] that [primary responsibility]"

2. **Chain of Thought**: Instructions for surfacing reasoning
   - Require explicit reasoning before and after tool calls
   - Use `<details>` tags for structured reasoning

3. **Workflow**: Step-by-step process for executing tasks
   - Numbered steps integrating tools and handoffs
   - Include when to use `list_handoffs` and `run_handoff`

4. **Reporting Findings**: How to present results
   - Raw findings before synthesis
   - Completeness tracking against requirements

5. **Strategy Section** (optional): Domain-specific approaches
   - Map query types to tool selection
   - Decision trees for complex scenarios

### Agent Content Guidelines

- **Scope check**: Agents verify requests match their expertise
- **Handoff integration**: Include `list_handoffs` and `run_handoff` as workflow
  steps, not separate sections
- **No entity references**: Instructions should be generic, not referencing
  specific data
- **Key principle reminder**: End with bold reminder that task is not complete
  until handoff

## Prohibitions

1. **DO NOT** modify a config file without updating its example counterpart
2. **DO NOT** commit secrets, credentials, or API keys to example files
3. **DO NOT** write agent instructions that reference specific entities or data
4. **DO NOT** omit the "Reporting Findings" pattern—agents must show their work
5. **DO NOT** create agents without the chain of thought section
6. **DO NOT** use handoffs section separate from the main workflow
