---
mode: agent
---

Analyze code changes comprehensively and consolidate multiple changelog entries
into concise, meaningful summaries while ensuring all documentation remains
synchronized.

## 1. Change Analysis

- Generate a git diff against the `main` branch to identify all modifications
- Search the codebase to understand the broader context and impact of changes
- Identify which components (services, packages, extensions, tools) are affected

## 2. Documentation Updates

- Follow `.github/instructions/documentation.instructions.md` for all standard
  documentation requirements
- Update documentation in the same commit as code changes

## 3. Changelog Consolidation Strategy

**Primary Goal**: Replace verbose, granular changelog entries with consolidated
summaries

**Consolidation Rules:**

- Group related changes into single, descriptive bullet points
- Focus on user-impact and functional changes, not implementation details
- Maximum 3-5 bullet points per component per date
- Prioritize breaking changes, new features, then bug fixes

**Example Consolidation:** Instead of 10 separate entries about individual
method changes:

```markdown
## 2025-08-28

- Enhanced `ConfigService` with improved path resolution using `#findPath()`
  method
- **BREAKING**: Made `dataPath()`, `storagePath()`, and `protoFile()` methods
  async
- Simplified error handling with clear messages instead of fallback paths
```

## Implementation Checklist

- [ ] Analyze git diff against main branch
- [ ] Search codebase for affected components
- [ ] Apply documentation standards from
      `.github/instructions/documentation.instructions.md`
- [ ] Consolidate verbose changelog entries into 3-5 meaningful bullet points
      per component
- [ ] Use today's date (2025-08-28) for new changelog entries
- [ ] Verify all cross-references remain accurate after changes
