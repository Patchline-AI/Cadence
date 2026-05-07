# Troubleshooting

## Install issues

### "Skill not found after `/reload-plugins`"

Verify the manifest parses:

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"
```

Should print nothing and exit 0. If it errors, fix the JSON syntax.

### "Plugin shows but skills don't appear"

Each skill needs a `SKILL.md` directly under `skills/<skill-name>/`. Run:

```bash
ls skills/*/SKILL.md
```

Should list 3 files (`cadence-pr-review`, `cadence-research`, `cadence-sweep`). Missing one means the corresponding skill won't load.

## Runtime issues

### "5 standards run but the three review lenses don't"

The lenses fire only on high-surface PR detection. Trigger conditions are listed in `skills/cadence-pr-review/references/specialist-trio.md` § "When to dispatch." If your PR doesn't match any trigger, the standards alone are sufficient.

To force the lenses on a PR you think should match: explicitly invoke `Use cadence-pr-review and run the three inline review lenses`.

### "Eval fixture's 5 findings aren't all flagged"

The 5 findings in `evals/expected-findings.md` are calibrated. If your install misses any:

1. Check the model in use — Cadence is calibrated against frontier models (Claude Opus 4.6 or newer recommended). Older or smaller models may miss findings.
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

That shows where Cadence is installed. References live under that install path's `skills/cadence-pr-review/references/` directory. On Windows that's typically `C:\Users\<you>\.claude\plugins\cadence\skills\...` or similar. Edit there, then `/reload-plugins`.

## Reporting bugs

Open an issue at https://github.com/Patchline-AI/Cadence/issues. Include:

- Cadence version (`cat .claude-plugin/plugin.json | grep version`)
- Claude Code version
- Model in use
- The diff or PR description that triggered the bug
- Expected vs actual report
