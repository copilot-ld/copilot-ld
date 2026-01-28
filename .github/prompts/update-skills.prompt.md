---
description: Update documentation and SKILL.md files for all components
agent: skilled-scarlet
---

Ensure all services, extensions, and packages have documentation that enables
effective use by developers and AI agents.

## 1. Inventory Components

Enumerate all directories under:

- `services/` - gRPC services
- `extensions/` - REST API adapters
- `packages/` - Framework-agnostic libraries

## 2. README.md Updates

For each component in `services/`, `extensions/`, and `packages/`:

**Check for `README.md`:**

- If missing, create one
- If present, verify it is current with the codebase

**README.md Structure** (keep very short, ~20-50 lines):

```markdown
# Component Name

One sentence describing what this component does.

## Usage

Minimal code example showing primary usage pattern.

## API

Brief list of main exports/endpoints (2-5 items max).
```

**Quality Criteria:**

- Matches actual exports/functionality in `index.js` or main entry point
- No outdated or removed APIs documented
- Present tense, concise language

## 3. SKILL.md Creation for Packages

For each library under `packages/`:

**Create `SKILL.md`** with YAML frontmatter describing how to use the library:

```markdown
---
name: libexample
description: >
  [Detailed 2-3 sentence description with keywords covering: purpose, main
  classes/functions, common use cases, integration patterns. Include specific
  terms an AI would search for when needing this capability.]
---

# [Package Name] Skill

## When to Use

Bullet list of scenarios where this package applies.

## Key Concepts

Brief explanation of core abstractions (1-2 sentences each).

## Usage Patterns

### Pattern 1: [Primary Use Case]

Complete, minimal code example.

### Pattern 2: [Secondary Use Case]

Complete, minimal code example.

## Integration

How this package connects with other platform components.
```

**Frontmatter Description Requirements:**

- Include the package name and its aliases
- List primary classes and functions by name
- Include domain keywords (e.g., "vector search", "embeddings", "RDF graph")
- Mention related packages it commonly works with
- 50-100 words in the description field

## 4. Implementation Checklist

- [ ] List all directories under `services/`, `extensions/`, `packages/`
- [ ] For each component, check README.md exists and is accurate
- [ ] For each package, create SKILL.md with keyword-rich frontmatter
- [ ] Verify code examples in documentation are valid and lint-clean
- [ ] Follow `.github/instructions/documentation.instructions.md` standards
- [ ] Commit changes with message:
      `docs: update component documentation and skills`
