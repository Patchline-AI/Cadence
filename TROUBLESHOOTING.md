# Troubleshooting

## Install issues

### "`/plugin` is not available in my Claude Code build"

Some Claude Code builds do not expose plugin commands yet. Install Cadence by
cloning the repo and symlinking its three skills instead.

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

The installer links `cadence-pr-review`, `cadence-research`, and
`cadence-sweep` into your Claude skills directory. It skips any existing
non-symlink skill directory instead of overwriting it.

### "Skill not found after `/reload-plugins`"

Verify the manifest parses:

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"
```

Should print nothing and exit 0. If it errors, fix the JSON syntax.

If you installed through `/plugin`, make sure the Patchline AI marketplace was
added from `Patchline-AI/Aria` in your plain shell, not inside a Claude chat:

```bash
claude plugin marketplace add Patchline-AI/Aria
```

If you added the marketplace before Cadence v0.1.0-alpha.3, refresh the local
marketplace cache:

```bash
claude plugin marketplace update patchline-ai
```

Then start Claude Code and run:

```text
/plugin install cadence@patchline-ai
```

### "`/reload-plugins` says 0 skills"

Some builds report `0 skills` in the reload summary even when namespaced plugin
skills are available. Test the namespace directly:

```text
/cadence:cadence-sweep
```

If that command runs, Cadence is installed. You can also invoke it in natural
language: `Run a weekly sweep on this repo.`

### "Plugin shows but skills don't appear"

Each skill needs a `SKILL.md` directly under `skills/<skill-name>/`. Run:

```bash
ls skills/*/SKILL.md
```

Should list 3 files (`cadence-pr-review`, `cadence-research`, `cadence-sweep`). Missing one means the corresponding skill won't load.

## Runtime issues

### "The 5 standards ran but the lenses didn't"

That's a bug in the run — **the lenses always run on every PR.** The trio (silent failures / security / test semantics) and the extended lenses (migration / idempotency / dependency / rollout) run after the 5 standards on every review; on a diff with no relevant surface they report `N/A` in one line rather than being skipped. The trigger lists in `specialist-trio.md` only mark where the lenses bite hardest, not whether they run.

If a run skipped them, force a complete pass: `Use cadence-pr-review and run the full trio and all extended lenses — no skipping.` Also confirm you're on a frontier model with full reasoning/thinking enabled.

### "Eval fixture findings aren't all flagged"

The plugin ships **five** eval fixtures, each with its own answer key (see `evals/RUN-EVAL.md`):
`sample-pr/` (5 standards + failure-semantics), `lambda-pr/` and `auth-pr/` and `rate-limit-pr/` (the trio lenses), and `clean-pr/` (must produce `VERDICT: PASS` — false-positive calibration). If your install misses findings or invents them on `clean-pr/`:

1. Run review on a frontier model (Claude Opus 4.6 or newer) with maximum reasoning/thinking enabled — review is not where to economize. The trio fixtures (`lambda-pr`/`auth-pr`/`rate-limit-pr`) are the most demanding; if they miss findings, raise the model/thinking budget first.
2. Check the prompt — `Use cadence-pr-review on <branch-or-fixture>` should be sufficient.
3. Open an issue with the report you got and the model used.

### "Skill recommends scope-change drill but I'm just reviewing my own branch"

The drill is mandatory when an agent's completion summary is in the conversation history. If you're reviewing your own work, the drill is a no-op safety check (it'll find that scope didn't grow and fall through to the standards). Not a bug.

## Customization issues

### "I added a pattern to references/security-review.md but it's not firing"

Confirm the file is at the right path. Run:

```bash
/plugin info cadence
```

That shows where Cadence is installed. References live under that install path's `skills/cadence-pr-review/references/` directory. On Windows, plugin installs typically land under `C:\Users\<you>\.claude\plugins\cache\patchline-ai\cadence\<version>\...`. Edit there, then `/reload-plugins`.

Direct edits inside the plugin cache can be overwritten by reinstall/update. If
the pattern is team policy, fork Cadence or vendor the reference file into your
own team skill.

## Reporting bugs

Open an issue at https://github.com/Patchline-AI/Cadence/issues. Include:

- Cadence version (`cat .claude-plugin/plugin.json | grep version`)
- Claude Code version
- Model in use
- The diff or PR description that triggered the bug
- Expected vs actual report
