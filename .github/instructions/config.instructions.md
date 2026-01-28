---
applyTo: "**/config/**"
---

# Config Instructions

Defines rules for managing configuration files and agent definitions.

## Principles

1. **Example Parity**: Every config file has an `.example` counterpart that must
   stay in sync.
2. **Secrets Stay Local**: Example files never contain real credentials, API
   keys, or environment-specific values.
3. **Agent Clarity**: Agent definitions are behavioral contracts—clear,
   actionable, and testable.

## Requirements

### File Pairing

When modifying any config file, update its example counterpart:

| Config File   | Example File          |
| ------------- | --------------------- |
| `config.json` | `config.example.json` |
| `tools.yml`   | `tools.example.yml`   |
| `eval.yml`    | `eval.example.yml`    |
| `*.agent.md`  | `*.agent.example.md`  |

### Agent Definitions

Agent files use YAML frontmatter followed by Markdown instructions:

```markdown
---
name: agent_name
description: One-line summary of the agent's purpose.
infer: true|false
tools:
  - tool_name
handoffs: []
---

# Agent Name

[Role statement: "You are a..." describing expertise]

## Chain of Thought

[Instructions for surfacing reasoning with <details> tags]

## Reporting Findings

[How to present results: raw findings before conclusions]

## [Domain] Strategy

[When to use which approach based on query type]

## [Domain] Workflow

[Step-by-step process for executing the strategy]
```

### Agent Content Guidelines

- **Role statement**: One sentence defining expertise and scope
- **Chain of thought**: Require explicit reasoning before actions
- **Workflow with handoffs**: Integrate `list_handoffs` and `run_handoff` as
  numbered steps in the main workflow—not as separate sections
- **Scope check**: Agents should verify requests match their expertise and hand
  off to specialists when appropriate
- **Reporting**: Mandate raw data before synthesis—prevents hallucination
- **Strategy section**: Map query types to approaches (conceptual, relationship,
  discovery)
- **Key Principles**: End with bold reminder that task is not complete until
  handoff

## Prohibitions

1. **DO NOT** modify a config file without updating its example counterpart
2. **DO NOT** commit secrets, credentials, or API keys to example files
3. **DO NOT** write agent instructions that reference specific entities or data
4. **DO NOT** omit the "Reporting Findings" pattern—agents must show their work
