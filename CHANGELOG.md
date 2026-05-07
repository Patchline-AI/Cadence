# Changelog

All notable changes to Cadence will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
