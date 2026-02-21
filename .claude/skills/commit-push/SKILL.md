---
name: commit-push
description: Stage changes, commit with conventional commit message, and push to current branch
argument-hint: "[optional commit message override]"
user-invokable: true
---

# Commit & Push

Stage all relevant changes, create a commit, and push to the current remote branch.

## Rules

1. **Never** commit `.env.local`, `.env`, or files containing secrets
2. **Never** force push
3. **Never** push to `main` without explicit user confirmation
4. Commit message format: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
5. Commit message body in English, concise (1-3 sentences describing the "why")
6. Always append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
7. Stage specific files — avoid `git add -A` or `git add .`

## Steps

1. Run `git status` and `git diff --stat` to understand changes
2. Run `git log --oneline -5` to match commit style
3. Stage relevant files (skip ignored/secret files)
4. If `$ARGUMENTS` is provided, use it as commit message. Otherwise, draft an appropriate one.
5. Commit using HEREDOC format
6. Push to current branch with `-u` flag
7. Report: commit hash, branch, files changed

## Commit Message Template

```
<type>: <short description>

<body: 1-3 sentences explaining what changed and why>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
