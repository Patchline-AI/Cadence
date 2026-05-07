---
name: cadence-sweep
description: The "Sweeps" pillar of the Cadence quality model — recurring cleanup that finds patterns no individual PR gate can see. Use whenever the user says "run a sweep", "weekly sweep", "what's accumulating", "pattern audit", or you've reached a natural cadence boundary (week-end, sprint-end, month-end, quarter-end). The crucial output of any sweep is a STRONGER FUTURE GATE — without that, a sweep is just one-off cleanup, not a ratchet.
---

# Cadence Sweep

> **Periodic team cleanup: stale work, flaky tests, dependency drift, repeated review patterns, and gaps the gates missed.**
> Output: **Issues, cleanup PRs, stronger future gates.**

**Announce at start:** "I'm using the cadence-sweep skill."

## What sweeps catch that gates can't

Drift accumulates across many PRs. Each individual PR passed every gate; in aggregate the system is degraded. Examples:

- **Correlated convergence** — strategies / models / behaviors look uncorrelated at launch but drift into correlation as conditions change. (Trading-swarm origin.)
- **Test-suite overfitting** — tests that pass on every PR but never catch real regressions. The loop itself becomes the source of overfitting.
- **Strategy drift through iteration** — N cycles to undebuggability. Nobody can trace which change broke production.
- **Compute / cost runaway** — agents chase dead-end hypotheses for weeks without exploration budgets.

These are the four canonical failure modes the Trading Swarm talk named (AI Agents 2026, May 5 2026). All of them slip past PR-level gates because no individual PR caused them.

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

## How to run a sweep

1. Pick a cadence (daily / weekly / monthly / quarterly).
2. Run the corresponding queries from `references/cadence-table.md`.
3. For each finding: open an issue OR file a cleanup PR.
4. **For each finding: ALSO file a gate-upgrade PR** that prevents the same drift class.
5. Move the cadence forward (advance the rotation slot for monthly subsystem audits).

## What this skill is NOT

It's not a replacement for incident response. Sweeps are scheduled cleanup. If something is on fire NOW, that's a gate failure, not a sweep target.
