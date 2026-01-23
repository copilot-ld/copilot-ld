---
applyTo: "**/*.instructions.md"
---

# Instructions for Instructions

Defines the format for instruction files to ensure concise, actionable guidance
that LLMs can follow without context overload.

## Principles

1. **Brevity Over Completeness**: 100-150 lines maximum. Omit what can be
   inferred. Every line must earn its place.
2. **Rules Over Examples**: State the rule clearly. Provide ONE minimal example
   only when the rule cannot be understood without it.
3. **Patterns Over Implementations**: Describe abstract patterns, not specific
   code. Let the LLM generalize to the current context.
4. **Constraints Over Guidance**: Focus on what NOT to do. LLMs handle open
   creativity well; they need boundaries.

## Format

```markdown
---
applyTo: "pattern"
---

# [Topic] Instructions

[1-2 sentence scope description]

## Principles

[3-5 numbered non-negotiable rules]

## Requirements

[Mandatory patterns with ONE minimal example per concept if needed]

## Prohibitions

[Numbered list of forbidden patterns with brief rationale]
```

## Requirements

### Scope Targeting

- Use the narrowest `applyTo` glob pattern that covers the relevant files
- `applyTo: "**"` is acceptable when the instruction genuinely applies globally
- Global instructions must be especially concise - compete for attention by
  being shorter, not broader
- Prefer file-type patterns (`"**/*.js"`) over directory patterns when possible

### Structure

- YAML frontmatter with `applyTo` pattern required
- Four sections only: Principles, Requirements, Prohibitions, and optional
  Examples
- No "Purpose Declaration", "Best Practices", or "Comprehensive Examples"
  sections
- Lead with actions, not explanations - put "what to do" before "why"

### Content

- State rules declaratively: "Classes use constructor injection" not "Classes
  should consider using..."
- One example per concept maximum, showing the pattern not a full implementation
- Examples must be generic and abstract - avoid specific class names, service
  names, or implementation details from the codebase
- Prefer pseudocode patterns over copy-paste-ready code

### Examples (when needed)

Use minimal diff-style or skeleton format:

```javascript
// ✅ Pattern: constructor injection
class Service {
  constructor(dep1, dep2) {
    /* validate, assign to #private */
  }
}

// ❌ Anti-pattern: object destructuring
class Service {
  constructor({ dep1, dep2 }) {
    /* forbidden */
  }
}
```

## Prohibitions

1. **DO NOT** exceed 150 lines - split into multiple focused files if needed
2. **DO NOT** exceed 50 lines for `applyTo: "**"` instructions - global means
   brief
3. **DO NOT** include multiple examples of the same pattern
4. **DO NOT** use specific implementation details (class names, file paths,
   service names) - use generic placeholders
5. **DO NOT** explain rationale extensively - one sentence maximum per rule
6. **DO NOT** duplicate information found in other instruction files
7. **DO NOT** include a "Best Practices" section - merge into Requirements
8. **DO NOT** include an "Examples" section - examples belong inline with rules
