---
applyTo: "**/*.md"
---

# Documentation

Documentation changes accompany code changes in the same commit.

## Official Files

| File                    | Domain                                    |
| ----------------------- | ----------------------------------------- |
| `README.md`             | Quick start, overview, usage examples     |
| `docs/index.md`         | Problem/solution, capabilities, use cases |
| `docs/concepts.md`      | Core concepts, architectural principles   |
| `docs/architecture.md`  | System structure, component relationships |
| `docs/reference.md`     | Service/package details, code generation  |
| `docs/configuration.md` | Environment variables, YAML configuration |
| `docs/processing.md`    | Knowledge processing, data management     |
| `docs/development.md`   | Local setup, development workflow         |
| `docs/deployment.md`    | Production deployment, infrastructure     |

One authoritative file per topic. Cross-reference, never duplicate.

## Component Changelogs

Each component in `extensions/`, `packages/`, `services/` maintains
`CHANGELOG.md` with descending chronological `## YYYY-MM-DD` entries.

## Rules

- Present tense only (except changelogs)
- Backticks for code symbols only; add other terms to `.dictionary.txt`
- JavaScript examples must be complete and lint-clean

## Prohibited

- Creating files beyond the nine official docs
- Duplicating information across files
- Omitting doc updates when making functional changes
