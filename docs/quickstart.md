# Cadence Quickstart

Five minutes from `git clone` to a working PR review.

## Install

Two steps. Step 1 runs in your **plain shell**. Step 2 runs **inside a Claude Code session**.

**Step 1 — plain shell (NOT inside Claude):**

```bash
claude plugin marketplace add Patchline-AI/Aria
```

Expected: `✔ Successfully added marketplace: patchline-ai (declared in user settings)`

If you added the Patchline marketplace during an earlier alpha, refresh it:

```bash
claude plugin marketplace update patchline-ai
```

**Step 2 — inside a Claude Code session** (run `claude` to start one, then):

```text
/plugin install cadence@patchline-ai
/reload-plugins
```

Expected: `✓ Installed cadence` then `Reloaded: 1 plugin · …`. The Patchline AI marketplace is hosted from the Aria repo and lists Cadence as a second plugin entry.

Some builds report `0 skills` in the reload summary even though namespaced
plugin skills are installed. If that happens, try `/cadence:cadence-sweep` or
ask `Run a weekly sweep on this repo.`

If your Claude Code build does not expose `/plugin` yet, use the manual
symlink installer:

macOS / Linux:

```bash
git clone https://github.com/Patchline-AI/Cadence.git ~/.claude-cadence
bash ~/.claude-cadence/scripts/install.sh
```

Windows PowerShell:

```powershell
git clone https://github.com/Patchline-AI/Cadence.git "$env:USERPROFILE\.claude-cadence"
pwsh "$env:USERPROFILE\.claude-cadence\scripts\install.ps1"
```

After `/reload-plugins`, Cadence's three skills are available:
- `cadence:cadence-pr-review` (`cadence-pr-review`)
- `cadence:cadence-research` (`cadence-research`)
- `cadence:cadence-sweep` (`cadence-sweep`)

No MCP server. No external account. Pure local skills.

## Verify the install

In any branch with a real diff:

```text
Use cadence-pr-review on this branch.
```

Claude announces "I'm using the cadence-pr-review skill", resolves the PR's base branch, and produces a report against `origin/$BASE...HEAD` (the resolved base) with the 5 Agent Review Standards.

## Verify against the fixture

The fixture is a deliberately-bad `route.ts` + an inadequate `route.test.ts` shipped with the plugin under `skills/cadence-pr-review/evals/sample-pr/`.

If you installed via `/plugin install`, the fixture is in the cache. Find the path first:

```text
/plugin info cadence
```

That prints something like `~/.claude/plugins/cache/patchline-ai/cadence/0.2.0-alpha.1/`. Then in Claude Code:

```text
Use cadence-pr-review on <install-path>/skills/cadence-pr-review/evals/sample-pr/ against <install-path>/skills/cadence-pr-review/evals/expected-findings.md.
```

If you cloned Cadence directly, `cd` into the repo and the relative path `skills/cadence-pr-review/evals/sample-pr/` works as-is.

Report should flag all 5 findings from `evals/expected-findings.md` (3 BLOCKERS, 2 FLAGS). If it misses any: tighten the skill, or check that you're running on a frontier model (calibrated against Claude Opus 4.6+).

## Four workflows

### 1. Review your own branch before opening the PR

```text
Use cadence-pr-review.
```

Output: 5-standards report. For high-surface PRs (auth / Lambda / concurrent-write / public unauthenticated endpoints / scope-grew), the skill automatically runs three additional review lenses (silent failures, security semantics, test-coverage semantics) inline against the same diff.

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

Direct command form:

```text
/cadence:cadence-sweep
```

## Customizing for your codebase

The skill ships with reference docs in `references/` covering each of the 5 standards. The patterns are generic by default. To customize:

1. Run `/plugin info cadence` to find Cadence's installed plugin path.
2. Open `<installPath>/skills/cadence-pr-review/references/security-review.md`.
3. Add your codebase-specific patterns (e.g. "all DDB writes on table X must use `expectedUpdatedAt`", "all API key access via `lib/secret-env.ts`", etc.).
4. The skill picks them up automatically on next invocation.

Direct edits inside the plugin cache can be overwritten by reinstall/update. If your custom patterns become team policy, fork Cadence or vendor those references into your own team skill.

## Troubleshooting

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md). Common issues:

- "Skill not found after `/reload-plugins`" → confirm `.claude-plugin/plugin.json` parses (`node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"`)
- "5 standards run but lenses don't" → check the skill's "When the trio is MANDATORY" section. The three inline lenses fire only on high-surface PR detection.
- "Eval fixture's 5 findings aren't all flagged" → the model harness may need tightening. Open an issue.
