# Cadence

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-D97757)](https://docs.claude.com/en/docs/claude-code/plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-0068FF)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-00E6E2)](./CHANGELOG.md)

**Quality at agentic velocity. Research, Gates, Sweeps.**

When agents produce code 10–50× faster than your CI absorbs it, quality stops being a single review moment and becomes a recurring practice. Cadence ships the practice as installable Claude Code skills.

```bash
# In Claude Code
/plugin marketplace add Patchline-AI/Cadence
/plugin install cadence@patchline-ai
/reload-plugins
```

No MCP server. No external account. Pure local skills.

---

## What you get

- **`cadence-pr-review`** — five Agent Review Standards (Codebase Drift, Conflicting PR, Security, Architectural Alignment, Test Coverage), plus a specialist trio dispatch pattern (silent-failure-hunter + security-auditor + pr-test-analyzer) for high-surface PRs, plus a scope-change drill for receiving agent completion summaries.
- **`cadence-research`** — the four-move research practice (map / inspect history / find seams / produce artifact) plus diagram-as-research thinking.
- **`cadence-sweep`** — the daily / weekly / monthly / quarterly sweep cadence with the sweep-to-gate ratchet.

## The methodology

Three pillars on three rhythms. See [`docs/methodology.md`](./docs/methodology.md) for the full framing.

> _Research reduces unknowns. Gates enforce what we know. Sweeps discover what we missed._

## The receipts

In the field test that produced this plugin, a real high-surface PR scored **0 BLOCKERS** under the 5 standards alone. Adding the parallel specialist trio surfaced **4 BLOCKERS and 16 FLAGS** that would have shipped to production — including a rate-limit fail-closed-as-throttle conflation, a Python `urllib.error.URLError` bypass in a Lambda handler, a secret-fallback gate predicate, and a public endpoint whose magic-byte sniff was untested at the unit level.

The 5 standards check **patterns**. The specialists check **semantics**. Both are necessary for high-surface code.

See [`docs/examples/reviewing-an-agent-pr.md`](./docs/examples/reviewing-an-agent-pr.md) for the full worked example.

## Quickstart

See [`docs/quickstart.md`](./docs/quickstart.md). Five minutes from `/plugin install` to a verified report.

## Why Cadence

Three things this plugin does that a generic "code review" tool doesn't:

1. **Layered gates with explicit time budgets.** The 5 standards are Layer 4 of a 5-layer gate ladder (L1 Fast Feedback <10 min, L2 Behavioral Verification <15 min, L3 Platform Coverage, L4 Human Ownership / 5 standards, L5 On-Demand Deep Checks). Velocity is preserved by the budgets.
2. **Specialist composition for semantics.** The 5 standards are pattern-checks. They miss semantics. The trio dispatch catches the failure modes the standards can't see.
3. **Sweep-to-gate ratchet.** Every sweep ships TWO things: cleanup PR AND gate-upgrade PR. The bar gets stricter every cycle. That's the ratchet — without it, sweeps are just one-off cleanup.

## Customizing for your codebase

The skills ship with **generic patterns** that apply to most codebases. To layer your codebase-specific patterns:

1. Edit `~/.claude/skills/cadence-pr-review/references/<standard>.md` after install.
2. Add your patterns to the relevant standard's checklist.
3. The skill picks them up on next invocation.

This is the migration path: install with the generic patterns, layer your specifics on top.

## Attribution

The Research / Gates / Sweeps framing, the five Agent Review Standards, the layered PR gate budgets, and diagram-as-research were anchored by talks at **AI Agents 2026** — most directly Julie Yaunches' *Accelerated Engineering* talk, with reinforcing material across the conference (Datadog on observability-as-verification, Trading Swarm on quality gates between research and production, the 4-layer agent stack on data/semantic/agent/trust separation). Cadence's contribution on top: the specialist trio dispatch pattern, the scope-change drill, the sweep-to-gate ratchet, and the executable form. See [`reference/attribution.md`](./reference/attribution.md) for the full citation.

## License

[MIT](./LICENSE). Use freely.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues + PRs welcome. Add new patterns to the standards' reference docs as you discover them.

## Made by

[Patchline AI](https://patchline.ai). We build agentic music tooling. Cadence is the quality framework we extracted from running AI agents against our own production codebase.
