# Contributing to SportySpaces

## Branching Strategy
We follow a **Feature Branch Workflow**. Create branches from `main` using this naming convention:
- `feat/<description>` - New features
- `fix/<description>` - Bug fixes
- `docs/<description>` - Documentation updates

Example: `feat/user-authentication`

## Commit Conventions
Use **Conventional Commits** format:
```
<type>(<scope>): <subject>
```

Examples:
- `feat(auth): add Google OAuth integration`
- `fix(bookings): resolve date validation issue`
- `docs(readme): update installation instructions`

## Resolving Conflicts
If two developers work in parallel and conflicts arise after one branch is merged:
1. Update `main`: `git checkout main && git pull origin main`
2. Rebase your branch: `git checkout your-branch && git rebase main`
3. Resolve conflicts in files, then: `git add . && git rebase --continue`
4. Force push: `git push origin your-branch --force-with-lease`

**Prevention:** Rebase frequently from `main` and keep PRs small and focused.
