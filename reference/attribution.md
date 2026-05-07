# Attribution

## NVIDIA — "Accelerated Engineering"

Julie Yaunches, "Technology Builder & Leader — Agents, LLMs, Evals & Observability @ NVIDIA"

Talk: **Accelerated Engineering**
Conference: AI Agents 2026
Date: May 5, 2026

The Research / Gates / Sweeps framework, the 5 Agent Review Standards, the Layered PR Gates with explicit time budgets, and the diagram-as-research practice are derived from this talk.

### Verbatim quotes used in Cadence

- "Once agents can produce code faster than the team can absorb it, quality becomes a set of recurring behaviors — not a single review moment."
- "Research reduces unknowns. Gates enforce what we know. Sweeps discover what we missed."
- "Gates and sweeps are different practices. A gate decides whether a specific change can move forward. A sweep is the recurring cleanup that finds patterns no single PR gate can see."
- "Research is a practice, not a pause."
- "If the agent starts with the wrong mental model, speed just compounds the wrong answer."
- "Diagramming is a thinking tool — not just documentation."
- "The bottleneck migrated from code generation to code validation."

### What Cadence adds on top

- **Specialist trio dispatch pattern** — parallel `silent-failure-hunter` + `security-auditor` + `pr-test-analyzer` for high-surface PRs. Receipts: a real PR review that returned 0 blockers under the 5 standards alone returned 4 blockers + 16 flags after the trio.
- **Scope-change drill** — 5-step trust-but-verify protocol for receiving an agent's PR completion summary. Catches scope creep that natural-language summaries downplay.
- **Sweep-to-gate ratchet** — every sweep ships TWO things: the cleanup AND the gate upgrade that prevents the same drift class from recurring. Without the ratchet, a sweep is just one-off cleanup.

## License

Cadence plugin code is MIT-licensed. The methodology references are public-domain ideas with attribution. Use freely.
