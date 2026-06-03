# Standard 1: Codebase Drift Detection

> "Is the PR patching code that has moved or been restructured upstream while the branch was open?"

_Commands use `origin/$BASE` — the PR's base branch, resolved in the SKILL's Step -1 (defaults to `main` only if unresolved). Never hardcode the base._

## Quick command

```bash
git fetch origin main
git log --oneline HEAD..origin/$BASE -- $(git diff origin/$BASE...HEAD --name-only)
```

If output: the branch is patching files that moved on main. **BLOCKER.**

## Drift hotspots

These areas drift fastest. Always look closer:

### Test-suite enrollment files
- The single source of truth for the quality pipeline. New test files added on main can collide with branch additions.
- Check: `git log --oneline HEAD..origin/$BASE -- <test-suite-map-file>`

### Service-module singletons
- Cross-cutting services (asset, project, release, intelligence) get many small additions.
- Check: `git diff origin/$BASE...HEAD --name-only | grep '^lib/services/'`

### Drift log / incident memory
- Every concurrent-write incident lands as a paragraph in the codebase's drift log (CLAUDE.md, ADR, postmortem index, etc.). If main has a new entry the branch hasn't seen, the branch may be reintroducing the exact pattern that incident fixed.
- Check: `git log --oneline HEAD..origin/$BASE -- CLAUDE.md` (or your equivalent)

## Action templates

If drift detected:
1. Identify which upstream commits moved the file.
2. Decide: rebase the branch, or carry forward the change manually.
3. Re-run the standard after the rebase.

If drift is in a test-suite map:
- The merge will likely be clean (JSON appends), but verify the new test files exist on disk.

If drift is in agent-orchestration config:
- Run your dry-run / plan command to see what would change before applying.
