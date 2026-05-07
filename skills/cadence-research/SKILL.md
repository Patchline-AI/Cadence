---
name: cadence-research
description: The "Research" pillar of the Cadence quality model — the per-task practice that runs BEFORE you touch code on a non-trivial subsystem. Implements the four moves (map the system, inspect the history, find the seams, produce an artifact) plus the diagram-as-research thinking pattern, anchored from talks at AI Agents 2026. Use whenever the user says "research before I touch <area>", "diagram-as-research", "map this subsystem before changing it", "produce a risk memo for <area>", or you're about to start work on a non-trivial change. Skip for one-line bug fixes where the seam is already obvious.
---

# Cadence Research

> **Research is a practice, not a pause.**
> If the agent starts with the wrong mental model, speed just compounds the wrong answer.

**Announce at start:** "I'm using the cadence-research skill."

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

## Diagram-as-Research

The fastest way to "produce an artifact" for systems work is a throwaway mermaid diagram, rendered to PNG when needed. See `references/diagram-as-research.md` for the full pattern, when to apply it, and what NOT to do.

## What this skill replaces

A casual "let me poke around the code first" approach. Cadence research is structured: four moves, in order, terminating in a named artifact. The artifact lives in your task scratchpad / `.planning/<task>/research.md` / wherever your team's research artifacts live.

## Operating rule

For non-trivial changes, the research pass is **not optional**. Skipping it ships fast code against the wrong mental model.
