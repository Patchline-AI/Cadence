# Sweep Cadence Reference Table

A starting point. Adjust the rotation slots to your team's reality. Every sweep
below ships with **at least one executable query** — a sweep you can't run is
just a good intention. Adapt tools to your stack (`rg` ↔ `grep`, `gh` optional,
package manager, cloud CLI).

> Sweeps are **incremental**. Scope to the delta since the last sweep (see the
> SKILL's "How to run a sweep", step 2) unless the ledger flags a recurrence.

## Daily

### Cost / idle-resource sweep
Identify idle compute, oversized DB instances, abandoned workspaces, log-archive opportunities.
```bash
# AWS example — last 14 days of spend by service, newest day's delta.
aws ce get-cost-and-usage --time-period Start=$(date -d '14 days ago' +%F),End=$(date +%F) \
  --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[-1].Groups[?Metrics.UnblendedCost.Amount>`5`]' --output table
```
Output: cleanup PR (right-size / delete) + a budget alert if a service trends up with no feature change (compute-runaway signal).

### Perf drift check
Run a routine perf-bench + drift-vs-baseline. Fail loud on any >20% regression.
```bash
<your-perf-bench-cmd> --json | <your-baseline-compare> --baseline tests/perf/baseline.json --threshold 0.20
```
Output: cleanup PR + tighter alert if a route regressed.

## Weekly

### Flaky-test review
Failures that retry-passed; suites with >5% flake rate over 7 days.
```bash
# From CI run history (GitHub Actions example): failed-then-passed on the same SHA.
gh run list --workflow ci --limit 200 --json conclusion,headSha,name \
  | jq -r 'group_by(.headSha)[] | select(any(.conclusion=="failure")) and any(.conclusion=="success")) | .[0].headSha'
```
Open an issue per flaky cluster. Gate-upgrade: quarantine + a ticket, never a blind retry bump.

### Orphan-test audit
Test files with no suite-map enrollment, no `__tests__` location, no recent change.
```bash
for f in $(git ls-files '**/*.test.*' '**/*.spec.*' '**/test_*.py'); do
  grep -qrl "$f" <test-suite-map-file> <feature-map-file> 2>/dev/null || echo "ORPHAN: $f"
done
```
Either enroll or delete. Gate-upgrade: a CI check that fails when a test file isn't enrolled.

### Coverage-gap audit
Shipped code with zero test references.
```bash
# Changed source files in the last 7 days with no sibling/colocated test.
git log --since='7 days ago' --name-only --pretty=format: -- 'src/**' 'app/**' 'lib/**' \
  | sort -u | grep -vE '\.(test|spec)\.' | while read f; do
    base=$(basename "$f" | sed -E 's/\.[tj]sx?$//'); rg -lq "$base" --glob '*test*' || echo "UNCOVERED: $f";
  done
```

### Mutation / overfitting spot-check
Catches "tests that pass on every PR but never go red" (test-suite overfitting).
```bash
# Run a mutation tool on one changed module per week in rotation.
<your-mutation-tool> --paths <module> --threshold 60   # e.g. stryker / mutmut / cosmic-ray
```
A surviving-mutant rate that's high means the tests assert intent, not behavior. Gate-upgrade: add the killing test.

### Fixture distribution
Guard against a single fixture dominating tests.
```bash
rg -o "fixtures/[A-Za-z0-9_./-]+" --no-filename tests/ | sort | uniq -c | sort -rn | head
```
Threshold: any single fixture > 30% of tests in a category → diversify.

### Long-tail typecheck
Catches quietly broken types in unused branches.
```bash
<your-typechecker> --noEmit    # e.g. tsc --noEmit / mypy / pyright
```

## Monthly

### Subsystem graph audit (rotation: one subsystem per week)
Surfaces drift in module boundaries, cyclic deps, dead code, and **correlated convergence** (modules that diverged at launch now share a dep/assumption).
```bash
<your-graph-tool> analyze <subsystem-path>     # graphify / code2graph / madge --circular
madge --circular <subsystem-path>              # quick cycle check if that's all you need
```

### Serverless / function-fleet audit
Which functions haven't been redeployed since their deps last updated? CVE scan per container.
```bash
# Functions whose last deploy predates the last lockfile change.
LOCK_CHANGED=$(git log -1 --format=%cI -- '*lock*')
aws lambda list-functions --query "Functions[?LastModified<'${LOCK_CHANGED}'].FunctionName" --output text
```

### Open-PR cleanup
PRs older than 14 days.
```bash
gh pr list --state open --json number,title,updatedAt \
  --jq '.[] | select(.updatedAt < (now - 14*86400 | todate)) | "\(.number)\t\(.title)"'
```
Stale-PR replacement: don't rebase-merge a stale PR that accreted unrelated changes; cherry-pick the targeted fix into a fresh worktree off current default.

## Quarterly

### Documentation drift
Does CLAUDE.md / coding-standards / contribution guide still match reality?
```bash
git log --since='3 months ago' --oneline -- CLAUDE.md AGENTS.md docs/ \
  | wc -l   # near-zero doc commits while code churned = drift
```

### Cursor rules / lint-rule audit
Which rules fire most? Which never fire?
```bash
<your-linter> --format json | jq -r '.[].ruleId' | sort | uniq -c | sort -rn
```
Rules that never fire are candidates for removal or are mis-targeted; rules that fire constantly are candidates for autofix or promotion.

## The ratchet — every sweep ships two PRs

For each finding above, the output is **NOT** just a cleanup PR. It is:

1. **Cleanup PR** — fixes the immediate drift.
2. **Gate-upgrade PR** — adds a check that prevents the same drift class from recurring.

If you only ship the cleanup, you'll see the same drift next quarter. If you ship the upgrade, the gate gets stricter every cycle. Record both in `ratchet-ledger.md` so a recurrence is visible. That's the ratchet.

## Scheduling

Cadence does not enforce a scheduler. Use your team's preferred mechanism:

- GitHub Actions cron
- Linear / Jira recurring tasks
- A scheduling skill in your Claude Code setup
- A Slack reminder that pings the on-call engineer

The rule: **the sweep happens whether or not anyone is paged**. If it depends on someone remembering, it won't happen.
