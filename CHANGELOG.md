# Changelog

All notable changes to Cadence will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0-alpha.1] — 2026-06-02

Comprehensive hardening pass. **Additive only — no skill content removed.**

### Added — `cadence-pr-review`
- **Every review pass runs on every PR.** The trio and extended lenses are not gated to high-surface PRs — the trigger lists only mark where to look hardest, never whether to run. A pass with no relevant surface reports `N/A` in one line; it is never skipped. Run review on a frontier model with full reasoning/thinking — review does not economize on coverage.
- **Always-on Failure-Semantics & Observability check** (`references/failure-semantics.md`) — gives contextless-500s, swallowed exceptions, and partial-success-200 an explicit home instead of mis-filing them under Architectural Alignment. Runs on every PR (lightweight Lens 1).
- **Extended lenses 4–7** in `references/specialist-trio.md`: data-migration/backward-compat, idempotency/retry-safety, dependency/supply-chain, rollout/reversibility. Each fires on a diff-content trigger.
- **New eval fixtures** for the trio (the previously untested high-value capability): `lambda-pr/` (Python `URLError` bypass + secret-fallback predicate), `auth-pr/` (JWT `aud`/`email_verified`/`token_use`/single-secret), `rate-limit-pr/` (body-DoS + UA bypass + fail-closed + untested magic-byte), and `clean-pr/` (false-positive calibration → must produce `VERDICT: PASS`). `RUN-EVAL.md` now drives all five.
- **Step -1 triage**: huge-diff risk-ranking + skip-generated-files rule; blast-radius ordering of blockers.

### Fixed — `cadence-pr-review`
- **Base branch no longer hardcoded to `origin/main`.** New Step -1 resolves `$BASE` from the PR / remote default; all standards and references substitute it. Wrong-base silent reviews were the most dangerous quiet failure.
- Eval rubric reconciled: the "generic 500 / no Sentry" BLOCKER is now attributed to the Failure-Semantics check (it was mis-attributed to Standard 4, which never mandated it).

### Added — `cadence-research`
- **Executable command set** for all four moves (`references/research-moves.md`) — history inspection, seam enumeration, and an always-do **blast-radius** step. Closes the gap where research was conceptual while pr-review was executable.
- **`RESEARCH.md` artifact template** (`references/research-artifact-template.md`), an **acceptance checklist**, an explicit **handoff to the gate** (failure modes → required regression tests; high-surface → mandatory trio), and a **lite mode** for medium changes.

### Added — `cadence-sweep`
- **Executable query per cadence-table row** — sweeps are now runnable, not aspirational.
- **Ratchet engine**: harvest recurring FLAGs from `cadence-pr-review` reports and promote the top one to a hard rule (the literal sweep-to-gate mechanism).
- **Ratchet ledger** (`references/ratchet-ledger.md`) with a recurrence rule, **sweep output format** (`references/sweep-output-format.md`), incremental (delta-since-last-sweep) scoping, and detections mapped to the four canonical failure modes.

### Added — cross-cutting
- **First-run calibration** (`reference/calibration.md`) auto-detects base branch, package manager, test runner, service/store/hook dirs, secret module, suite map, drift log, hot tables, and high-surface paths into `.cadence/profile.md`. All three skills read it.

## [0.1.0-alpha.4] — 2026-05-07

### Fixed
- README customization path now matches the actual install layouts. The previous instruction pointed at `~/.claude/skills/cadence-pr-review/...`, which only resolves for the symlink fallback installer. The corrected step routes users through `/plugin info cadence` first, then names both the plugin-cache layout (`~/.claude/plugins/cache/patchline-ai/cadence/<version>/`) and the symlink layout, and adds a `/reload-plugins` step + a note that direct cache edits can be overwritten on reinstall.
- Quickstart eval-verification step no longer assumes users are inside the Cadence repo. The relative `skills/cadence-pr-review/evals/sample-pr/` path doesn't resolve for `/plugin install` users — the new step has them resolve `<install-path>` via `/plugin info cadence` first, with a parenthetical for the cloned-repo case.
- README version badge bumped to `0.1.0-alpha.4` so the homepage stops claiming `0.1.0-alpha`.

## [0.1.0-alpha.3] — 2026-05-07

### Fixed
- Removed the stale Cadence-local marketplace manifest so `claude plugin validate`
  validates Cadence as a plugin. Aria remains the Patchline AI marketplace.

## [0.1.0-alpha.2] — 2026-05-07

### Fixed
- Clarified that marketplace registration runs from the plain `claude` CLI,
  while `/plugin install` and `/reload-plugins` run inside Claude Code.
- Documented the namespaced skill commands (`/cadence:cadence-sweep`, etc.)
  and the benign `0 skills` reload-summary confusion seen in some builds.
- Bumped plugin/package metadata to match the hardened prerelease tag.

## [0.1.0-alpha] — 2026-05-07

### Added
- Initial release.
- `cadence-pr-review` skill — 5 Agent Review Standards (Codebase Drift Detection, Conflicting PR Detection, Security Review, Architectural Alignment, Test Coverage Assessment), three inline review lenses for high-surface PRs (silent failures, security semantics, test-coverage semantics), and scope-change drill.
- `cadence-research` skill — diagram-as-research thinking pattern.
- `cadence-sweep` skill — daily/weekly/monthly/quarterly sweep cadence with sweep-to-gate ratchet.
- Methodology doc and quickstart.
- Acceptance evals against a sample PR fixture (`evals/sample-pr/route.ts` + `route.test.ts`).
