# Sweep output format

Like `cadence-pr-review`, a sweep produces a single structured report so the
output is greppable and the ratchet is auditable. The `RATCHET:` lines and the
ledger rows are the part that matters — findings without a gate-upgrade are
cleanup theater.

## Template

```markdown
# Sweep Report: <cadence> — <YYYY-MM-DD>

**Scope:** delta since <last-sweep-ref> (<N commits>)  ·  **Rotation slot:** <e.g. subsystem = catalog>

## Findings

### F1 — <drift class> [<severity: HIGH | MED | LOW>]
- Evidence: `<command output / file:line / metric>`
- Cleanup: <issue or PR link, or "PR #N">
- **Gate-upgrade:** <the check that prevents recurrence — PR link or proposed>
- Ledger: <row added / row reopened>

### F2 — ...

## Recurrence check
<rows from the ledger with "Recurred since? = yes" — these outrank new findings>

## Ratchet summary
- RATCHET: <N> findings → <M> gate-upgrades filed
- RATCHET: <K> recurring classes escalated (FLAG→BLOCKER / advisory→CI)

## Next sweep
- Advance rotation to: <next subsystem / next slot>
- Carry-forward: <unfinished gate-upgrades>
```

## Severity rubric (sweep)

| Severity | When |
|---|---|
| **HIGH** | Drift that is actively degrading prod or security posture (cost runaway, recurring concurrency class, CVE in deployed function). |
| **MED** | Accumulating risk not yet biting (flaky cluster, coverage gap on shipped code, doc drift on a hot subsystem). |
| **LOW** | Hygiene (fixture concentration, lint rules that never fire, stale PRs). |

## The non-negotiable line

Every finding MUST have a non-empty **Gate-upgrade** entry. If a finding genuinely needs no gate (truly one-off), say so explicitly: `Gate-upgrade: none — one-off, justification: <reason>`. A silent blank is treated as an incomplete sweep.

## Final-line summary

End every report with:

- `SWEEP: <N> findings, <M> gate-upgrades, <K> recurrences escalated`

so downstream tooling (and the next sweep) can read the ratchet trend.
