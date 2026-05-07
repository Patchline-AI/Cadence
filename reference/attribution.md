# Attribution

## AI Agents 2026 — anchoring talks

The Research / Gates / Sweeps framework, the 5 Agent Review Standards, the Layered PR Gates with explicit time budgets, and the diagram-as-research practice are derived from talks at the **AI Agents 2026** conference (May 2026). The most directly relevant single talk was Julie Yaunches' *Accelerated Engineering* (NVIDIA), with reinforcing material across the conference (observability-as-verification, quality gates between research and production, the data/semantic/agent/trust layered stack).

### Ideas anchored from this talk

The following framings shaped Cadence's structure (paraphrased; verbatim quotes from the talk are minimized in this public repo until a public recording or transcript is available):

- The "bottleneck migrated from code generation to code validation" framing — when agents make code generation cheap, validation becomes the gating practice.
- The three-pillar quality model: Research before work, Gates at change boundaries, Sweeps on a recurring schedule.
- Gates and sweeps as distinct practices: gates are event-driven and decide a single change; sweeps are cadence-driven and find drift across many changes.
- Research as a practice, not a pause — produce an artifact (plan, diagram, risk memo) before touching code.
- Diagramming as a thinking tool, not just documentation.
- Five Agent Review Standards as the team's executable PR review (drift, conflicting PRs, security, architecture, test coverage).

Two short quotes worth keeping verbatim:

- *"Research reduces unknowns. Gates enforce what we know. Sweeps discover what we missed."*
- *"If the agent starts with the wrong mental model, speed just compounds the wrong answer."*

### What Cadence adds on top

- **Three inline review lenses** — silent failures, security semantics, test-coverage semantics, run as additional review passes by the same skill (no external subagents) for high-surface PRs. Receipts: a real PR review that returned 0 blockers under the 5 standards alone returned 4 blockers + 16 flags after the lenses.
- **Scope-change drill** — 5-step trust-but-verify protocol for receiving an agent's PR completion summary. Catches scope creep that natural-language summaries downplay.
- **Sweep-to-gate ratchet** — every sweep ships TWO things: the cleanup AND the gate upgrade that prevents the same drift class from recurring. Without the ratchet, a sweep is just one-off cleanup.

## License

Cadence plugin code is MIT-licensed. The methodology references are public-domain ideas with attribution. Use freely.
