# Sweep Cadence Reference Table

A starting point. Adjust the rotation slots to your team's reality.

## Daily

- **Cost / idle-resource sweep** — identify idle compute, oversized DB instances, abandoned workspaces, log-archive opportunities. Tooling: cloud-provider cost-explorer + an idle-resource heuristic.
- **Perf drift check** — run a routine perf-bench + drift-vs-baseline. Fail loud on any >20% regression.

## Weekly

- **Flaky-test review** — failures that retry-passed; suites with >5% flake rate over 7 days. Open an issue per cluster.
- **Orphan-test audit** — test files with no test-suite-map enrollment, no `__tests__` location, no recent changes. Either enroll or delete.
- **Coverage-gap audit** — shipped code with zero test references. (For monorepos: scan `src/`, `app/`, `lib/services/`, and any code that ships to production.)
- **Fixture distribution** — guard against a single fixture dominating tests (e.g. one audio file used in 90% of audio-pipeline tests). Threshold: any single fixture > 30% of tests in a category.
- **Long-tail typecheck** — `tsc --noEmit` (or your equivalent) against the 3-month-old long tail. Catches quietly broken types in unused branches.

## Monthly

- **Subsystem graph audit** — one named subsystem per week in rotation. Run your codebase's whole-subsystem mapping tool (graphify / equivalent). Surfaces drift in module boundaries, cyclic dependencies, and dead code.
- **Serverless / function-fleet audit** — which functions haven't been redeployed since their dependencies last updated? CVE scan on each container.
- **Open-PR cleanup** — PRs older than 14 days. Stale-PR replacement pattern: don't rebase-merge stale PRs that have accumulated unrelated changes; cherry-pick the targeted fix into a fresh worktree off current main.

## Quarterly

- **Documentation drift** — does the team's CLAUDE.md / coding-standards / contribution guide still match the codebase reality? Re-run any doc-generation tools against the current state.
- **Cursor rules / linting rule audit** — which rules fire most frequently? Which never fire? Which fire on the wrong things?

## The ratchet — every sweep ships two PRs

For each finding above, the output is **NOT** just a cleanup PR. It is:

1. **Cleanup PR** — fixes the immediate drift.
2. **Gate-upgrade PR** — adds a check that prevents the same drift class from recurring.

If you only ship the cleanup, you'll see the same drift next quarter. If you ship the upgrade, the gate gets stricter every cycle. That's the ratchet.

## Scheduling

Cadence does not enforce a scheduler. Use your team's preferred mechanism:

- GitHub Actions cron
- Linear / Jira recurring tasks
- A scheduling skill in your Claude Code setup
- A Slack reminder that pings the on-call engineer

The rule: **the sweep happens whether or not anyone is paged**. If it depends on someone remembering, it won't happen.
