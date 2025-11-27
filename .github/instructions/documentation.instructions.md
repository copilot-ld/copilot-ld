---
applyTo: "**"
---

# Documentation Instructions

Defines standards for maintaining project documentation in sync with code
changes.

## Principles

1. **Single Source of Truth**: Each topic has ONE authoritative file. Other
   files cross-reference, never duplicate.
2. **Synchronous Updates**: Documentation changes accompany code changes in the
   same commit.
3. **Present Tense Only**: Describe current state. Never reference past behavior
   (except changelogs).
4. **Spellcheck Strategy**: Use backticks ONLY for code symbols and paths. Add
   all other terms to `.dictionary.txt`.

## Requirements

### Documentation Structure

Nine official files, each with exclusive domain ownership:

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

### Component Changelogs

Each component in `extensions/`, `packages/`, `services/` maintains
`CHANGELOG.md`:

```markdown
# Changelog

## YYYY-MM-DD

- Added `newMethod()` to handle edge cases
- Fixed `validate()` null pointer issue
```

Format: descending chronological order, `## YYYY-MM-DD` headings, bullet points
with backticks for code symbols only.

### Update Workflow

When adding components:

1. Create `CHANGELOG.md` in component directory
2. Determine which doc file owns the topic
3. Update authoritative file, add cross-references from others

When modifying components:

1. Add `CHANGELOG.md` entry with current date
2. Update authoritative doc file for affected functionality
3. Verify cross-references remain valid

### Code Blocks

JavaScript in documentation must be complete and lint-clean. No `// TODO`,
`...`, or undefined variables.

## Prohibitions

1. **DO NOT** duplicate information across files - one authoritative source per
   topic
2. **DO NOT** create documentation files beyond the nine official files
3. **DO NOT** omit documentation updates when making functional changes
4. **DO NOT** use backticks for non-code terms - add to `.dictionary.txt`
   instead
5. **DO NOT** reference past states or changes in documentation (changelogs
   excepted)
