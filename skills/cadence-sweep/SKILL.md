---
name: cadence-sweep
description: The "Sweeps" pillar of the Cadence quality model — recurring cleanup that finds patterns no individual PR gate can see. Use whenever the user says "run a sweep", "weekly sweep", "what's accumulating", "pattern audit", or you've reached a natural cadence boundary (week-end, sprint-end, month-end, quarter-end). The crucial output of any sweep is a STRONGER FUTURE GATE — without that, a sweep is just one-off cleanup, not a ratchet.
---

# Cadence Sweep

> **Periodic team cleanup: stale work, flaky tests, dependency drift, repeated review patterns, and gaps the gates missed.**
> Output: **Issues, cleanup PRs, stronger future gates.**

**Announce at start:** "I'm using the cadence-sweep skill."

## First-run calibration (once per repo)

If `.cadence/profile.md` exists, read it — it supplies the test-suite map (orphan/enrollment sweeps) and the hot-tables list (concurrency recurrence checks). If it doesn't exist, run `reference/calibration.md` first. The ledger lives at `.cadence/ratchet-ledger.md` — create it on the first sweep if absent.

## What sweeps catch that gates can't

Drift accumulates across many PRs. Each individual PR passed every gate; in aggregate the system is degraded. Examples:

- **Correlated convergence** — strategies / models / behaviors look uncorrelated at launch but drift into correlation as conditions change. (Trading-swarm origin.)
- **Test-suite overfitting** — tests that pass on every PR but never catch real regressions. The loop itself becomes the source of overfitting.
- **Strategy drift through iteration** — N cycles to undebuggability. Nobody can trace which change broke production.
- **Compute / cost runaway** — agents chase dead-end hypotheses for weeks without exploration budgets.

These are the four canonical failure modes the Trading Swarm talk named (AI Agents 2026, May 5 2026). All of them slip past PR-level gates because no individual PR caused them.

Each has a concrete detection in `references/cadence-table.md` — a failure mode you can name but not detect is just folklore. The mapping:

| Failure mode | Detectable signal | Sweep that catches it |
|---|---|---|
| Test-suite overfitting | tests that pass on every PR but never go red; coverage on changed lines that's always green | Weekly orphan/coverage + mutation spot-check |
| Strategy / behavior drift | recurring FLAG class across many PR reports; config that's churned N times | Weekly PR-report harvest (below) |
| Correlated convergence | modules/strategies that diverged at launch now share a failure (shared dep, shared assumption) | Monthly subsystem graph audit |
| Compute / cost runaway | spend trend up with no feature change; agents looping on dead-end hypotheses | Daily cost/perf-drift sweep |

## The recommended cadence

See `references/cadence-table.md` for the full table. Headlines:

| Cadence | Sweep | Output |
|---|---|---|
| **Daily** | Cost / idle-resource sweep, perf drift check vs baseline | Cleanup PR + tighter alerts |
| **Weekly** | Flaky-test review, orphan tests / coverage gaps / fixture distribution audit, long-tail typecheck | Cleanup PRs + suite-map updates |
| **Monthly** | Subsystem graph audit (one subsystem per week in rotation), serverless-fleet CVE + redeploy-lag scan, open-PR cleanup | Cleanup PRs + stale-PR replacements |
| **Quarterly** | Documentation drift (does CLAUDE.md / coding-standards / SECURITY.md still match reality?) | Doc PRs |

## The sweep-to-gate ratchet

This is the part most teams miss. **A sweep without a stronger future gate is just one-off cleanup.** The value is the ratchet: every sweep ships TWO things:

1. The cleanup PR that fixes the immediate drift.
2. The gate upgrade that prevents the same drift class from recurring.

Reference pattern: a 2026 concurrent-write race incident shipped a follow-up PR that added an `expectedUpdatedAt` opt-in concurrency guard to the write path AND the regression test that captures the repro. Future writes against the legacy path now have a discoverable test that fails when concurrency is wrong, lifting the bar for L1/L2 gates without anyone having to remember the lesson.

## The ratchet engine — harvest your PR reports

This is the mechanism that turns sweeps into a ratchet, and it's the most-skipped step. `cadence-pr-review` produces machine-readable reports (every one ends in a `VERDICT:` line, and every FLAG names a standard + a `file:line`). **The recurring FLAG is your next gate rule.**

```bash
# Collect the FLAG lines from your accumulated review reports (adapt the path
# to wherever your reports land — PR comments, a reports/ dir, etc.).
rg -h "^\- \[ \] \*\*(STANDARD|Lens|Failure)" reports/ \
  | sed -E 's/`[^`]*`//g' \
  | sort | uniq -c | sort -rn | head -20
```

For the top recurring FLAG: **promote it from a soft FLAG to a hard rule** in the relevant `cadence-pr-review/references/<standard>.md`. That is the literal sweep-to-gate ratchet — a pattern your reviewers keep flagging by hand becomes a check the gate enforces automatically. Ship that promotion as the gate-upgrade PR.

## How to run a sweep

1. Pick a cadence (daily / weekly / monthly / quarterly).
2. **Scope to the delta since the last sweep** (sweeps are incremental, not full re-scans):
   ```bash
   LAST=$(git log -1 --format=%H --grep "chore(sweep)")   # last sweep commit, or a date
   git log --oneline ${LAST}..HEAD                          # what changed since
   ```
   Full re-scan only on the first sweep or when the ledger says a drift class recurred.
3. Run the corresponding queries from `references/cadence-table.md`.
4. **Run the ratchet engine** (above) to surface the top recurring review FLAG.
5. For each finding: open an issue OR file a cleanup PR.
6. **For each finding: ALSO file a gate-upgrade PR** that prevents the same drift class.
7. **Record the sweep in the ratchet ledger** (`references/ratchet-ledger.md`) — finding → gate-upgrade PR → recurrence status. Without the ledger the ratchet can't ratchet.
8. Write the sweep report using `references/sweep-output-format.md` and move the cadence forward (advance the rotation slot for monthly subsystem audits).

## What this skill is NOT

It's not a replacement for incident response. Sweeps are scheduled cleanup. If something is on fire NOW, that's a gate failure, not a sweep target.
