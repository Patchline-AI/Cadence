# RESEARCH.md artifact template

> Copy this into `.planning/research/<task-slug>.md` (or your team's location)
> and fill it. The artifact is the deliverable of `cadence-research`. It carries
> into the PR description and feeds `cadence-pr-review`.

```markdown
# Research: <task / subsystem>

**Date:** <YYYY-MM-DD>  ·  **Author:** <agent/human>  ·  **Mode:** full | lite

## 1. System map (Move 1)
<3–5 sentences: what this boundary is, its entry points, its public surface,
what it owns vs. delegates. A throwaway diagram link if one was drawn.>

## 2. History (Move 2)
- Prior PRs / reverts: <list with links, or "none found after searching <queries>">
- Postmortems / incidents touching this code: <list, or "none">
- Lessons that constrain this change: <bullets>

## 3. Seams & trust boundaries (Move 3)
| Seam | Type | Failure mode if it breaks |
|---|---|---|
| <e.g. POST body → handler> | trust | <unvalidated input reaches write> |
| <e.g. two writers on Projects row> | ownership/concurrency | <lost write> |
| <e.g. outbound callback> | integration | <DNS/timeout escapes untagged> |

## 4. Blast radius (Move 3)
- Call sites / importers a change touches: <files/modules>
- Downstream consumers that could break: <list>

## 5. Proposed approach (Move 4)
<the plan, in steps. What changes, in what order (expand/contract if schema).>

## 6. Rollback plan
<how to undo this safely; feature flag / kill switch if risky; reversibility of
any migration.>

## 7. Handoff to the gate
- **Failure modes that MUST become regression tests:** <list — Standard 5 checks these>
- **High-surface?** <yes/no — if yes, the trio + relevant extended lenses are mandatory at review>
- **Drift-log entries to check at PR time:** <prior reverts/postmortems from §2>
- **Migration/backcompat/idempotency/rollout concerns:** <which extended lenses apply>
```

## How this artifact is used

- The **human** reads it before approving the approach.
- The **agent** keeps it in context during implementation so speed compounds the *right* mental model.
- `cadence-pr-review` consumes §7: each named failure mode should appear as a test in the PR, and the high-surface flag tells the reviewer whether Step 6 is mandatory.

Keep it short. A research memo nobody reads is as useless as no research at all.
