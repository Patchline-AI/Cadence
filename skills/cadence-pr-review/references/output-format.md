# Output Format

The skill always produces a single markdown report. The structure below is non-negotiable so downstream tooling (test selector, sweep reports) can grep it reliably.

## Template

```markdown
# PR Review: <branch-name>

**Diff summary:** N files changed (+X / -Y)
**Touched areas:** [billing | catalog | projects | upload | chat | aws-data-path | sentry | tests | docs | infra]
**Commits:** N commits ahead of origin/$BASE

## Blockers (must fix before merge)

- [ ] **STANDARD-N**: <one-sentence finding>
  - File: `path/to/file.ts:LINE`
  - Why: <one-sentence reason>
  - Fix: <concrete remediation>
  - Reference: <link to drift log, prior PR, or doc>

## Flags (review carefully, ship if reviewer agrees)

- [ ] **STANDARD-N**: <finding>
  - File: `path/to/file.ts:LINE`
  - Why: <reason>
  - Recommendation: <action>

## Required gates (run before merge)

- [ ] `pnpm typecheck`
- [ ] `pnpm test:unit`
- [ ] `pnpm qa:feature <slug>` — if the codebase's feature-map has a matching slug for the touched area
- [ ] Manual verification: <what to click/check>

## Notes

<anything else worth surfacing — non-blocking>
```

## Severity rubric

| Severity | When |
|---|---|
| **BLOCKER** | Hard rule violation from any standard or the always-on Failure-Semantics check. Cannot merge. |
| **FLAG** | Pattern divergence with credible business reason. Reviewer may approve. |
| **NOTE** | Stylistic, scope-creep, or minor doc gap. Informational only. |

**Ordering rule:** within the Blockers list, order by **blast radius** (most-likely-to-ship-and-hurt first), not by standard number. The human reads top-down and fixes in that order. Every BLOCKER and FLAG MUST cite an exact `file:line` and a falsifiable reason — a finding you can't anchor to a line is a NOTE, not a BLOCKER.

## Touched-area taxonomy

Use a consistent set of labels so the test selector can pattern-match. Example taxonomy:

- `billing` — payment-API routes, payment SDK helpers, paywall components
- `catalog` — asset/catalog API routes, catalog components, asset-service module
- `projects` — project/release API routes, project-service module
- `upload` — upload API routes, upload helpers, queue processors
- `chat` — chat API routes, chat components, chat-store hook, agent backend
- `aws-data-path` — AWS SDK helpers, auth middleware, request-auth module
- `sentry` — Sentry config, instrumentation, global error boundary
- `tests` — test directories, *.test.ts, *.spec.ts
- `docs` — docs directories, *.md
- `infra` — scripts, build configs, Dockerfiles, dependency lockfiles

If a diff touches multiple areas, list all. Order alphabetically.

## Final-line summary

End every report with one of:

- `VERDICT: BLOCK — <count> blocker(s)`
- `VERDICT: FLAG — <count> flag(s), 0 blockers`
- `VERDICT: PASS — 0 blockers, 0 flags`

Downstream tooling reads this line.
