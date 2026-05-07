# Cadence — the methodology

> _Once agents can produce code faster than the team can absorb it, quality becomes a set of recurring behaviors — not a single review moment._

When code generation costs nothing, **code validation** becomes the bottleneck. Cadence is one operationalized response: three quality practices on three different rhythms.

## The three pillars

```
                       ┌─────────────────────────────┐
                       │  SWEEPS  (recurring rhythm) │
                       │  "What is accumulating?"    │
                       │  → flaky tests, drift, gaps │
                       │    the gates missed         │
                       └─────────────┬───────────────┘
                                     │ output: stronger gates
                                     ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  GATES  (event-driven, at change boundaries)                   │
   │  "Can this work move forward?"                                 │
   │   L1 Fast Feedback     <10 min   25+ parallel checks           │
   │   L2 Behavioral         <15 min   E2E in real containers       │
   │   L3 Platform          per push   cross-platform               │
   │   L4 Human Ownership   pre-merge  CODEOWNERS + 5 review skills │
   │   L5 On-Demand          manual    real GPU / costly scenarios  │
   └────────────────────────────────┬───────────────────────────────┘
                                    │ guards
                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  RESEARCH  (per-task, before work)                             │
   │  "What do we need to understand?"                              │
   │  Map the system → Inspect the history → Find the seams →       │
   │  Produce an artifact (plan, diagram, risk memo).               │
   │  "If the agent starts with the wrong mental model,             │
   │   speed just compounds the wrong answer."                      │
   └────────────────────────────────────────────────────────────────┘
```

## Why three rhythms

A single review moment cannot absorb code that arrives at agentic velocity. The three pillars run on three different cadences because each catches a different class of failure:

- **Research** runs **before work** — when the unknowns are still cheap to surface. Skip it and your agent will write fast code against the wrong mental model.
- **Gates** run **at change boundaries** — the deterministic "can this PR merge?" check. Layered with explicit time budgets so that velocity is preserved.
- **Sweeps** run **on a recurring schedule** — the cleanup ritual. Catches drift no individual PR could see (correlated convergence, dependency lag, repeated review patterns, gaps the gates missed).

> _Research reduces unknowns. Gates enforce what we know. Sweeps discover what we missed._

## Gates ≠ Sweeps

A common confusion. They look similar (both are quality checks). They are not the same practice.

| | Gate (event-driven) | Sweep (cadence-driven) |
|---|---|---|
| **Trigger** | A change is ready to move | Time passes, patterns accumulate |
| **Question** | "Can this PR merge?" | "What needs cleaning across the floor?" |
| **Output** | Pass / fail / fix before proceeding | Issues, cleanup PRs, **stronger future gates** |

The crucial output of any sweep is a **stronger future gate**. Otherwise it's just one-off cleanup. The value is the ratchet.

## The 5 Agent Review Standards

The Gate-time review (Layer 4 above) decomposes into five executable checks the agent runs against its own diff before a human ever sees it:

1. **Codebase Drift Detection** — Is the PR patching code that has moved or been restructured upstream while the branch was open?
2. **Conflicting PR Detection** — Does this overlap with, contradict, or duplicate another open PR?
3. **Security Review** — Are trust boundaries respected? Are controls fail-closed, not fail-open?
4. **Architectural Alignment** — Does this move toward the target architecture or away from it?
5. **Test Coverage Assessment** — Do the tests prove behavior or just prove intent?

Cadence ships these as the `cadence-pr-review` skill.

## Where the standards stop and the specialists start

The 5 standards are deterministic, pattern-based checks. They miss **semantics**. For high-surface PRs (auth surface, Lambda code, concurrent-write paths, public unauthenticated endpoints, or any PR that has absorbed another PR via merge), the gate is incomplete without a follow-up semantic pass.

Cadence ships **three additional review lenses** that run inline as part of the same skill — no external subagents required. Each lens looks at the same diff through a different angle:

- **Lens 1 — Silent failures.** Catches `.catch(() => null)` corrupting downstream state, fail-closed semantics that obscure outages, ungated Sentry capture, partial-success returning 200.
- **Lens 2 — Security.** Catches JWT `aud`/`client_id` validation gaps, single-secret blast radius, identity-hash bypass, body-buffer DoS, lock-takeover clock-skew, info disclosure.
- **Lens 3 — Test coverage semantics.** Catches layered-but-not-composed integration tests, public endpoint magic-byte sniffs that exist but are tested only via vacuous integration runners, regression tests missing for claimed fixes.

**The receipts:** in the field test that produced this plugin, the 5 standards alone returned 0 blockers on a real PR. The three lenses caught **4 production traps** the standards-based pass would have shipped. See [`docs/examples/reviewing-an-agent-pr.md`](./examples/reviewing-an-agent-pr.md) for the worked example.

## When another agent hands you a PR completion summary

A cousin pattern. When Codex / Claude Code / similar agents finish work and paste a "PR opened, addressed feedback" summary, that summary is **a set of claims, not evidence**. Cadence ships the **scope-change drill**: 5 steps to verify what actually changed before you re-review. See `skills/cadence-pr-review/references/scope-change-detection.md`.

## Attribution

The Research / Gates / Sweeps framing, the five Agent Review Standards, and the layered PR gate budgets were anchored by talks at **AI Agents 2026**, with reinforcing material across the conference (observability-as-verification, quality gates between research and production, the data/semantic/agent/trust layered stack). The three inline review lenses, the scope-change drill, and the sweep-to-gate ratchet are this plugin's contribution on top.

See [`reference/attribution.md`](../reference/attribution.md) for the full citation.
