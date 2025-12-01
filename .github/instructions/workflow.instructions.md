---
applyTo: "**"
---

# Development Workflow Instructions

Defines the standard Git and GitHub workflow for contribution, ensuring clean
history and issue tracking.

## Principles

1. **Issue-Centric**: All work ties directly to a tracked issue.
2. **Linear History**: Maintain a clean, linear history via rebasing and
   squashing.
3. **Automated Standards**: Adhere to strict naming and formatting for tooling
   compatibility.

## Requirements

### Branching

Name branches using the issue type and number:

```bash
git checkout -b fix-123  # For issue #123
```

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(auth): add login support
fix(api): handle timeout errors
```

### Workflow

1. **Check**: Run checks and auto-fixes before committing.
   ```bash
   npm run check:fix
   ```
2. **Squash**: Combine related changes into atomic commits.
3. **Rebase**: Keep branch up-to-date with `main`.
   ```bash
   git fetch origin main
   git rebase origin/main
   ```
4. **Push**: Force push to update the remote branch.
   ```bash
   git push -f origin fix-123
   ```
5. **Pull Request**: Use `gh` CLI to create and merge (do not delete branch).
   ```bash
   gh pr create --fill
   gh pr merge --squash
   ```

## Prohibitions

1. **DO NOT** use merge commits when updating from main - always rebase.
2. **DO NOT** push vague commit messages - use Conventional Commits.
3. **DO NOT** leave multiple "wip" commits - squash before PR.
4. **DO NOT** merge PRs manually via web UI if `gh` CLI can be used.
5. **DO NOT** delete branches after merge - release workflow relies on
   references.
