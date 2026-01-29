---
applyTo: "**/*.md"
---

# Documentation Instructions

Documentation changes accompany code changes in the same commit. One
authoritative file per topic—cross-reference, never duplicate.

## Principles

1. **Single Source of Truth**: Each topic has exactly one authoritative file
2. **Code-Doc Sync**: Documentation updates accompany code changes in same
   commit
3. **Present Tense**: Use present tense throughout (except changelogs)
4. **Executable Examples**: All code examples must be complete and lint-clean

## Requirements

### Official Documentation Files

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

Each component in `extensions/`, `packages/`, `services/` maintains a
`CHANGELOG.md` file with descending chronological entries:

```markdown
# Changelog

## 2025-11-27

- Added feature X for improved Y
- Fixed issue with Z

## 2025-11-24

- Refactored module for better performance
```

Entry format: `- [action verb] [description]` (e.g., "Added", "Fixed",
"Removed", "Updated", "Refactored")

### Spellcheck and Dictionary

Custom terms go in `.dictionary.txt` at project root. The spellchecker runs on
all markdown and HTML files except `examples/` and `*.prompt.md`.

Add terms that are:

- Technical jargon specific to this project
- Acronyms and abbreviations
- Package names and identifiers
- Domain-specific vocabulary

```bash
# Check spelling
npm run check

# View dictionary
cat .dictionary.txt | sort | head -20
```

### Markdown Formatting

- Use backticks only for code symbols (`functionName`, `ClassName`)
- Headers use sentence case: "Configuration options" not "Configuration Options"
- Tables align columns with pipes and dashes
- Code blocks specify language for syntax highlighting
- Links use relative paths within repository

### Code Examples

All JavaScript examples must:

- Be complete and runnable in isolation
- Pass ESLint with project configuration
- Use project conventions (imports, private fields, etc.)
- Include JSDoc for public functions

```javascript
// ✓ Complete example
import { Service } from "@pkg/service";
const service = new Service(config);
const result = await service.process(data);

// ✗ Incomplete snippet
service.process(data); // Missing context
```

## Prohibitions

1. **DO NOT** create documentation files beyond the nine official docs
2. **DO NOT** duplicate information across files—cross-reference instead
3. **DO NOT** omit documentation updates when making functional changes
4. **DO NOT** use backticks for non-code terms—add to dictionary instead
5. **DO NOT** include incomplete code examples that won't run
6. **DO NOT** use future or past tense in documentation (except changelogs)
