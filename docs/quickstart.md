# Cadence Quickstart

Five minutes from `git clone` to a working PR review.

## Install

In Claude Code:

```bash
/plugin marketplace add Patchline-AI/Cadence
/plugin install cadence@patchline-ai
/reload-plugins
```

After `/reload-plugins`, Cadence's three skills are available:
- `cadence-pr-review`
- `cadence-research`
- `cadence-sweep`

No MCP server. No external account. Pure local skills.

## Verify the install

In any branch with a real diff:

```text
Use cadence-pr-review on this branch.
```

Claude announces "I'm using the cadence-pr-review skill" and produces a report against `origin/main...HEAD` with the 5 NVIDIA Agent Review Standards.

## Verify against the fixture

```bash
git checkout <fresh-branch>
# Apply the sample fixture as if it were your branch's diff
git apply --check skills/cadence-pr-review/evals/sample-pr.diff || git apply skills/cadence-pr-review/evals/sample-pr.diff
git add . && git commit -m "test: cadence eval fixture"
```

Then in Claude Code:

```text
Use cadence-pr-review.
```

Report should flag all 5 findings from `evals/expected-findings.md`. If it misses any: the skill needs tightening.

## Four workflows

### 1. Review your own branch before opening the PR

```text
Use cadence-pr-review.
```

Output: 5-standards report. For high-surface PRs (auth / Lambda / concurrent-write / public unauthenticated endpoints / scope-grew), the skill auto-dispatches the specialist trio in parallel.

### 2. Review another agent's PR completion summary

When Codex / another agent pastes a "PR opened, addressed feedback" summary, run:

```text
Run the scope-change drill on this summary, then re-review the delta.
```

The skill runs the trust-but-verify drill from `references/scope-change-detection.md` BEFORE reviewing — `git fetch` + delta diff + claim-by-claim verification. Catches scope creep that the summary downplays.

### 3. Research a subsystem before you touch it

For non-trivial changes:

```text
Run cadence-research on the <subsystem-name> before I make changes.
```

Output: a one-page mermaid diagram + risk memo at `.planning/research/<task-slug>.md`. The diagram is throwaway thinking; the artifact is what you and the agent both work from during gates.

### 4. Run a weekly sweep

End of every week:

```text
Run cadence-sweep weekly.
```

Output: a list of findings (flaky tests, orphan tests, coverage gaps, fixture distribution, perf drift) plus the gate-upgrade PRs each finding implies.

## Customizing for your codebase

The skill ships with reference docs in `references/` covering each of the 5 standards. The patterns are generic by default. To customize:

1. Open `~/.claude/skills/cadence-pr-review/references/security-review.md` (path may differ on your install).
2. Add your codebase-specific patterns (e.g. "all DDB writes on table X must use `expectedUpdatedAt`", "all API key access via `lib/secret-env.ts`", etc.).
3. The skill picks them up automatically on next invocation.

This is the migration path: install Cadence with its generic patterns; layer your codebase-specific patterns on top as you discover them.

## Troubleshooting

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md). Common issues:

- "Skill not found after `/reload-plugins`" → confirm `.claude-plugin/plugin.json` parses (`node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"`)
- "5 standards run but trio doesn't" → check the skill's "When the trio is MANDATORY" section. Trio fires only on high-surface PR detection.
- "Eval fixture's 5 findings aren't all flagged" → the model harness may need tightening. Open an issue.
