---
name: cadence-research
description: The "Research" pillar of the Cadence quality model — the per-task practice that runs BEFORE you touch code on a non-trivial subsystem. Implements the four moves (map the system, inspect the history, find the seams, produce an artifact) plus the diagram-as-research thinking pattern, anchored from talks at AI Agents 2026. Use whenever the user says "research before I touch <area>", "diagram-as-research", "map this subsystem before changing it", "produce a risk memo for <area>", or you're about to start work on a non-trivial change. Skip for one-line bug fixes where the seam is already obvious.
---

# Cadence Research

> **Research is a practice, not a pause.**
> If the agent starts with the wrong mental model, speed just compounds the wrong answer.

**Announce at start:** "I'm using the cadence-research skill."

## First-run calibration (once per repo)

If `.cadence/profile.md` exists in the repo, read it — it tells you where services/stores/hooks live (Move 1) and where the drift log / incident memory is (Move 2), so the moves target the right paths. If it doesn't exist, the calibration in `reference/calibration.md` (at the Cadence plugin/repo root, ~2 min) makes every move sharper. Not blocking — research still runs without it.

## When to run

Always before:

- Touching multi-agent orchestration config
- Modifying a deterministic-state-machine pipeline (e.g. payment / upload / event-driven workflows)
- Editing concurrent-write paths on hot database tables
- Auth-surface changes (JWT verification, session cookies, admin gates, OAuth flows)
- Adding or refactoring a serverless function
- Wiring a new MCP server or modifying agent collaborations
- Catalog/search dedup paths that depend on synthetic IDs

Skip for:

- One-line bug fixes where the seam is obvious
- Documentation-only changes
- Fixing a flaky test in a single suite

## The four moves

1. **Map the system** — Ask the agent to read the codebase and explain the architecture before it proposes a change.
2. **Inspect the history** — Have it trace recent commits, open PRs, issue threads, and prior decisions so you do not repeat old mistakes.
3. **Find the seams** — Identify ownership boundaries, trust boundaries, integration points, and places where tests already encode behavior.
4. **Produce an artifact** — Turn the research into a plan, diagram, checklist, or risk memo that the human and agent can both work from.

The four moves are not abstract. Each has concrete, executable steps. **Run the commands — don't just intend to.**

## Executable moves

Full command set in `references/research-moves.md`. The headlines:

### Move 1 — Map the system

```bash
git ls-files <subsystem-path> | head -50          # what's in the boundary
rg -n "export (async )?function|export class|export const" <path>  # the public surface
```
Read the entry points and the public exports before forming any opinion. State the architecture back in 3–5 sentences before proposing a change.

### Move 2 — Inspect the history (this is where most agents skip — don't)

```bash
git log --oneline -20 -- <path>                   # recent churn
git log -p --follow <file> | head -200            # how it got to its current shape
git blame -L <start>,<end> <file>                 # who/why on the lines you'll touch
gh pr list --search "<path>" --state all --limit 20   # prior attempts (incl. closed/reverted)
rg -n "<subsystem>" CLAUDE.md ADR* docs/postmortems 2>/dev/null  # incident memory
```
A reverted PR or a postmortem paragraph is the single highest-signal artifact you can find before touching a subsystem.

### Move 3 — Find the seams (+ blast radius)

A **seam** is any boundary where assumptions change hands. Enumerate them:
- **Trust boundaries** — where unauthenticated/untrusted input crosses into trusted code.
- **Ownership boundaries** — which module/service owns which field; where two writers touch one row.
- **Integration points** — network calls, queues, DB, third-party APIs (each is a failure mode).
- **Where tests encode behavior** — existing tests are the executable spec; read them.
- **Invariant locations** — where a "this must always be true" lives, and where a retry/concurrency path could break it.

**Blast radius — always do this.** Before changing a symbol, find everyone who depends on it:
```bash
rg -n "<functionName>|<ClassName>|<exportedConst>" --type ts --type py    # call sites
git grep -n "from .*<module>" || rg -n "import .*<module>"                # importers
```
The change isn't "this file" — it's "this file plus everyone in the blast radius." Name them in the artifact.

### Move 4 — Produce the artifact

Write it to `.planning/research/<task-slug>.md` (or your team's location) using the template in `references/research-artifact-template.md`. The artifact is the deliverable — research that doesn't terminate in a written artifact didn't happen.

## Handoff to the gate

Research is the *before* pillar; `cadence-pr-review` is the *at-boundary* pillar. Connect them explicitly:

- **Every failure mode you name in Move 3 becomes a required regression test** the PR must include (Standard 5 / Test Coverage will check for it).
- **Every trust boundary / concurrent-write path / auth surface you map becomes a Step-6 trigger** — note in the artifact "this change is high-surface; the trio is mandatory at review."
- **Every prior reverted PR / postmortem you find in Move 2 becomes a drift-log check** for Standard 1.

Carry the artifact into the PR description. The reviewer (human or agent) should be able to trace each test and each flagged surface back to a line in the research memo.

## Acceptance — when is research "done"?

Research is complete when the artifact names, at minimum:
- [ ] The architecture of the boundary in 3–5 sentences (Move 1).
- [ ] At least one historical signal: prior PR, revert, or postmortem — or an explicit "none found" after searching (Move 2).
- [ ] Every seam, and for each seam its failure mode (Move 3).
- [ ] The blast radius: the call sites / importers that a change touches (Move 3).
- [ ] A proposed approach + a rollback plan (Move 4).
- [ ] The handoff list: which tests the PR must add, and whether the change is high-surface.

If any box is empty, the research pass isn't done — finish it before writing code.

## Lite mode (medium-size changes)

Not every change is a one-liner or a multi-agent-config rewrite. For **medium** changes (a contained feature in a known subsystem), run a lite pass: **Move 2 (history) + Move 3 blast-radius only**, skip the diagram, write a 5-bullet artifact. The full four moves are for genuinely non-trivial / high-surface work; the lite pass keeps research from being skipped entirely on the middle tier.

## Diagram-as-Research

The fastest way to "produce an artifact" for systems work is a throwaway mermaid diagram, rendered to PNG when needed. See `references/diagram-as-research.md` for the full pattern, when to apply it, and what NOT to do.

## What this skill replaces

A casual "let me poke around the code first" approach. Cadence research is structured: four moves, in order, terminating in a named artifact. The artifact lives in your task scratchpad / `.planning/<task>/research.md` / wherever your team's research artifacts live.

## Operating rule

For non-trivial changes, the research pass is **not optional**. Skipping it ships fast code against the wrong mental model.
