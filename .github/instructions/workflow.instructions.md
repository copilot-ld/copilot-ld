---
applyTo: "**"
---

# Git Workflow

Multi-agent environment: other agents may commit to this repository at any time.
Integrate git operations into task planning. A task is not complete until
changes are committed and pushed.

## Workflow

```text
1. [make changes - one logical unit]
2. git add <specific-files>
3. git commit -m "type(scope): description"
4. git push origin main
5. [repeat from step 1 for next logical unit]
```

A logical unit is a coherent change: a feature, a fix, a refactor. Multiple
related files edited together form one logical unit, not separate commits.

If push fails: `git pull --rebase origin main` then push again.

## Task Planning

Group related changes into logical units. Include "commit and push" as part of
completing each unit. Do not mark a task complete until changes are pushed.

## Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(scope): add new capability
fix(scope): correct behavior
refactor(scope): restructure without behavior change
docs(scope): update documentation
```

## After All Changes

Run `make check` and `make check-fix` before considering work complete.

## Prohibitions

1. **DO NOT** use `git add -A` or `git add .` (captures other agents' work)
2. **DO NOT** wait until end of session to commit (conflicts accumulate)
3. **DO NOT** force push or rewrite history on `main`
