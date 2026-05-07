# Standard 2: Conflicting PR Detection

> "Does this overlap with, contradict, or duplicate another open PR?"

## Quick command

```bash
gh pr list --state open --json number,title,files,headRefName --limit 50 \
  | jq -r '.[] | "\(.number)\t\(.title)\t\(.headRefName)"'
```

Then for each open PR that looks adjacent:

```bash
gh pr view <number> --json files | jq -r '.files[].path' | sort
git diff origin/main...HEAD --name-only | sort
comm -12 <(gh pr view <number> --json files | jq -r '.files[].path' | sort) \
        <(git diff origin/main...HEAD --name-only | sort)
```

If `comm` returns shared paths: real overlap. **FLAG** if independent fixes can coexist, **BLOCKER** if the changes contradict.

## Common overlap risks

### Same serverless-function config block
- Two PRs editing different entries in the same serverless-function config can merge cleanly but produce inconsistent deploy ordering.
- Resolution: coordinate the deploy order in the merge.

### Same agent-orchestration config block
- Hard conflict if two PRs both modify the supervisor's `collaborator_configurations` (or equivalent).
- Resolution: pick one, rebase the other.

### Same database schema for hot tables
- Multiple PRs adding concurrency guards (`expectedUpdatedAt`) without a unified pattern is a recurring failure mode.
- Resolution: pick a canonical reference impl in your codebase; align both PRs to it.

### Same service-module singleton
- Two PRs adding methods to the same service usually merges fine but can produce silent type drift.
- Run `pnpm typecheck` (or your equivalent) after the merge.

### Same test-suite-map block
- Append conflicts. Sort the suites array alphabetically before merge to make diffs smaller.

## Codex / parallel-agent pattern

If you (Claude) and Codex (or another agent) are working two tracks of one incident in parallel:
- Each track gets its own worktree + branch.
- Track 1 owns the product fix paths; Track 2 owns tooling/skills.
- The handoff doc enumerates "do not touch" files for each side.
- Even with that, run this standard before either side opens a PR.

## When NOT to flag

- Two PRs editing different files in the same package: not a conflict.
- Two PRs both touching `package.json` in the dependencies block: usually merges; flag only if same package edited.
