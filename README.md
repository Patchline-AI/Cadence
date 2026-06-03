# Cadence

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-D97757)](https://docs.claude.com/en/docs/claude-code/plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-0068FF)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0--alpha.1-00E6E2)](./CHANGELOG.md)

**Quality at agentic velocity. Research, Gates, Sweeps.**

When agents produce code 10–50× faster than your CI absorbs it, quality stops being a single review moment and becomes a recurring practice. Cadence ships the practice as installable Claude Code skills.

## Install

Two steps. The first step is a **shell command, not a slash command** — run it from a plain terminal, not from inside a Claude Code chat session.

### Step 1 — add the marketplace (plain terminal)

```bash
# Run this in your shell, NOT inside a /chat session
claude plugin marketplace add Patchline-AI/Aria
```

The Patchline AI marketplace is hosted from the Aria repo and lists Cadence as a second plugin entry. Expected output:

```
✔ Successfully added marketplace: patchline-ai (declared in user settings)
```

If you added the Patchline marketplace during an earlier alpha, refresh the
local marketplace cache first:

```bash
claude plugin marketplace update patchline-ai
```

### Step 2 — install the plugin (inside Claude Code)

Now start a Claude Code session (`claude`), then run these as slash commands inside the session:

```text
/plugin install cadence@patchline-ai
/reload-plugins
```

Expected output: `✓ Installed cadence. Run /reload-plugins to apply.` followed by `Reloaded: 1 plugin · …`. Cadence has no MCP server and no external account: it installs pure local skills.

Some builds report `0 skills` in the reload summary even though namespaced
plugin skills are installed. The reliable check is to run one of the Cadence
commands, such as `/cadence:cadence-sweep`, or ask Claude in natural language:
`Run a weekly sweep on this repo.`

### Try it — first runs after install

Inside the same Claude Code session, ask:

```text
Run a weekly sweep on this repo.
```

That triggers `cadence-sweep` to walk through the weekly drift checks and print findings + the gate-upgrade PRs each finding implies. Two more concrete first runs:

If you prefer the explicit namespaced command:

```text
/cadence:cadence-sweep
```

```text
Use cadence-pr-review on the current branch.
```

```text
Run cadence-research on <subsystem-or-file> before I touch it.
```

### Fallback installer (when `/plugin` is not in your Claude Code build)

Some older Claude Code builds don't expose `/plugin` yet. Symlink installer instead:

```bash
git clone https://github.com/Patchline-AI/Cadence.git ~/.claude-cadence
bash ~/.claude-cadence/scripts/install.sh
```

On Windows PowerShell:

```powershell
git clone https://github.com/Patchline-AI/Cadence.git "$env:USERPROFILE\.claude-cadence"
pwsh "$env:USERPROFILE\.claude-cadence\scripts\install.ps1"
```

---

## What you get — three skills on three different rhythms

Each skill maps to one of the three pillars. They fire on different cadences for a reason — see [Methodology](./docs/methodology.md).

| Skill | Pillar | When it fires | What it does |
|---|---|---|---|
| **`cadence-research`** | Research | Per-task, BEFORE work | Four-move research practice with an **executable command set** (map / inspect history / find seams + **blast radius** / produce artifact), a `RESEARCH.md` template, an acceptance checklist, a lite mode, and an explicit handoff to the gate, plus diagram-as-research thinking. Use before non-trivial changes — auth surfaces, concurrent-write paths, multi-agent config. |
| **`cadence-pr-review`** | Gates | Event-driven, AT change boundaries | Five Agent Review Standards (Codebase Drift, Conflicting PR, Security, Architectural Alignment, Test Coverage) + an **always-on Failure-Semantics & Observability check** + three trio lenses for high-surface PRs (silent failures, security, test-coverage semantics) + **extended lenses 4–7** (migration/backcompat, idempotency, dependency, rollout) + a scope-change drill. Dynamic base-branch resolution; five eval fixtures incl. a clean/PASS calibration set. Use before opening any PR. |
| **`cadence-sweep`** | Sweeps | Recurring (daily / weekly / monthly / quarterly) | Drift cleanup the gates can't catch (flaky tests, dependency lag, repeated review patterns) — now with an **executable query per sweep**, the **ratchet engine** (promote a recurring review FLAG to a hard gate rule), a **ratchet ledger** with a recurrence rule, and incremental scoping. Every sweep ships TWO things: cleanup PR AND a gate-upgrade PR. |

## The methodology

Three pillars on three rhythms. See [`docs/methodology.md`](./docs/methodology.md) for the full framing.

<details>
<summary><strong>The three pillars (click to expand)</strong></summary>

```text
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

</details>

> _Research reduces unknowns. Gates enforce what we know. Sweeps discover what we missed._

## The receipts

In the field test that produced this plugin, a real high-surface PR scored **0 BLOCKERS** under the 5 standards alone. Three specialist review angles — silent-failure semantics, security semantics, and test-coverage semantics — surfaced **4 BLOCKERS and 16 FLAGS** that would have shipped to production, including a rate-limit fail-closed-as-throttle conflation, a Python `urllib.error.URLError` bypass in a Lambda handler, a secret-fallback gate predicate, and a public endpoint whose magic-byte sniff was untested at the unit level. Cadence packages those three angles as inline review lenses you run as part of the same skill.

The 5 standards check **patterns**. The lenses check **semantics**. Both are necessary for high-surface code.

See [`docs/examples/reviewing-an-agent-pr.md`](./docs/examples/reviewing-an-agent-pr.md) for the full worked example.

## Quickstart

See [`docs/quickstart.md`](./docs/quickstart.md). Five minutes from `/plugin install` to a verified report.

## Why Cadence

Three things this plugin does that a generic "code review" tool doesn't:

1. **Layered gates with explicit time budgets.** The 5 standards are Layer 4 of a 5-layer gate ladder (L1 Fast Feedback <10 min, L2 Behavioral Verification <15 min, L3 Platform Coverage, L4 Human Ownership / 5 standards, L5 On-Demand Deep Checks). Velocity is preserved by the budgets.
2. **Specialist composition for semantics.** The 5 standards are pattern-checks. They miss semantics. Three additional review lenses (silent failures, security semantics, test-coverage semantics) catch the failure modes the standards can't see.
3. **Sweep-to-gate ratchet.** Every sweep ships TWO things: cleanup PR AND gate-upgrade PR. The bar gets stricter every cycle. That's the ratchet — without it, sweeps are just one-off cleanup.

## Customizing for your codebase

The skills ship with **generic patterns** that apply to most codebases. To layer your codebase-specific patterns:

1. Inside Claude Code, run `/plugin info cadence` to find the install path. On `/plugin install` it lands at `~/.claude/plugins/cache/patchline-ai/cadence/<version>/`. The fallback symlink installer puts it at `~/.claude/skills/cadence-pr-review/`.
2. Edit `<install-path>/skills/cadence-pr-review/references/<standard>.md`.
3. Add your patterns to the relevant standard's checklist.
4. Run `/reload-plugins` (or restart the session). The skill picks up the changes on next invocation.

**Faster path — calibrate once.** Instead of editing the cache, run the first-run calibration (`reference/calibration.md`). It auto-detects your base branch, package manager, test runner, service/store/hook dirs, secret module, suite map, drift log, hot tables, and high-surface paths into a `.cadence/profile.md` **in your repo** (survives reinstalls). All three skills read it on every invocation.

Direct edits inside the plugin cache can be overwritten by reinstall/update. If your patterns become team policy, fork Cadence or vendor the reference files into your own team skill.

This is the migration path: install with the generic patterns, layer your specifics on top.

## Attribution

The Research / Gates / Sweeps framing, the five Agent Review Standards, the layered PR gate budgets, and diagram-as-research were anchored by talks at **AI Agents 2026**, with reinforcing material across the conference (observability-as-verification, quality gates between research and production, the data/semantic/agent/trust layered stack). Cadence's contribution on top: the three inline review lenses, the scope-change drill, the sweep-to-gate ratchet, and the executable form. See [`reference/attribution.md`](./reference/attribution.md) for the full citation.

## License

[MIT](./LICENSE). Use freely.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues + PRs welcome. Add new patterns to the standards' reference docs as you discover them.

## Made by

[Patchline AI](https://patchline.ai). We build agentic music tooling. Cadence is the quality framework we extracted from running AI agents against our own production codebase.
