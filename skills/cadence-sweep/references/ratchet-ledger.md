# The ratchet ledger

> A sweep without tracking can't ratchet. The ledger is how you know whether a
> gate-upgrade actually landed and whether a drift class recurred anyway.

The thesis of Cadence sweeps is "every sweep ships a stronger future gate." That
claim is only true if you can **prove the gate got stronger and the drift
stopped recurring**. The ledger is that proof. Without it, "we'll add a gate"
is an intention that evaporates by the next cycle.

## Where it lives

A single append-only file in your repo: `.cadence/ratchet-ledger.md` (or
wherever your team keeps operational records). One row per sweep finding. Never
delete rows — a closed row that reopens is the most important signal you have.

## The format

```markdown
# Ratchet Ledger

| Date | Sweep | Finding (drift class) | Cleanup PR | Gate-upgrade PR | Gate landed? | Recurred since? |
|---|---|---|---|---|---|---|
| 2026-05-12 | weekly | Concurrent-write race on Projects row | #312 | #313 (expectedUpdatedAt + regression test) | yes | no |
| 2026-05-19 | weekly | Orphan test not enrolled | #321 | #322 (CI enrollment check) | yes | no |
| 2026-05-26 | weekly | Same UA-in-rate-limit FLAG, 4th PR | — | #330 (promote FLAG→hard rule in security-review.md) | pending | n/a |
```

## How to use it

1. **Before a sweep:** read the ledger. Any row with "Recurred since? = yes" is a failed ratchet — the gate-upgrade didn't actually prevent the class. Re-open it as the sweep's first finding; a recurring class outranks new findings.
2. **During a sweep:** add a row per finding. The "Gate-upgrade PR" column is mandatory — a finding with a blank gate-upgrade is incomplete (cleanup-only = not a ratchet).
3. **After the gate-upgrade merges:** flip "Gate landed?" to yes.
4. **Next time the same class appears in a PR review or sweep:** flip "Recurred since?" to yes on the original row. That's your signal the gate was too weak — strengthen it (often: a soft FLAG that should have become a hard BLOCKER rule).

## The recurrence rule

> If a drift class recurs after its gate-upgrade landed, the gate-upgrade was insufficient. The fix is not "clean it up again" — it's "make the gate strictly stronger" (FLAG → BLOCKER, advisory → CI-enforced, lint-warn → lint-error).

Three recurrences of the same class without the gate getting stronger means the team is doing cleanup theater, not ratcheting. The ledger makes that visible in one glance.

## Connection to the PR-review reports

The "promote a recurring FLAG to a hard rule" move (see the SKILL's ratchet
engine) lands as a ledger row whose gate-upgrade PR edits a
`cadence-pr-review/references/<standard>.md`. That closes the loop:
review reports → recurring FLAG → ledger row → reference-doc rule → the gate now
enforces what reviewers used to catch by hand.
