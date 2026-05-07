# Contributing to Cadence

Thanks for considering a contribution.

## What we accept

- **New patterns for any of the 5 standards** — security checks, drift detection, architectural conventions, test-coverage gaps. Add to the relevant `skills/cadence-pr-review/references/<standard>.md`.
- **New eval fixtures** — synthetic-but-plausible diffs that exercise specific standards. Add to `skills/cadence-pr-review/evals/` with an accompanying `expected-findings.md`.
- **New sweep targets** — recurring drift classes the cadence table doesn't yet cover. Add to `skills/cadence-sweep/references/cadence-table.md`.
- **Worked examples** — anonymized real-world PR-review stories. Add to `docs/examples/`.
- **Bug fixes** for skills that misbehave on real diffs.

## What we don't accept

- **Patchline-specific patterns.** Cadence is generic. If a finding only matters to Patchline's codebase, it doesn't belong here.
- **Vendor-specific patterns** unless broadly applicable. AWS Cognito gotchas are fine; a single-vendor SDK quirk usually isn't.
- **MCP server additions.** Cadence is intentionally local-only. No external dependencies.

## Workflow

1. Open an issue describing the gap or pattern.
2. Fork, branch, commit (frequent commits, conventional-commit messages).
3. Run `pnpm lint` (or `npm run lint`) — markdownlint must pass.
4. Open a PR.
5. Self-review against `cadence-pr-review` (eat your own dogfood).

## Eval discipline

Every new pattern in a standard's reference doc should come with a fixture line in `evals/sample-pr.diff` (or a new `evals/<scenario>.diff`) and an entry in `expected-findings.md`. Patterns without evals are not enforceable.

## Style

- Markdown headers: ATX (`#`), not Setext.
- Code blocks: fenced with language hint.
- Quote NVIDIA verbatim text in italics with attribution; everything else in your own words.
- No emojis in skill files; emojis in user-facing docs are fine but sparing.

## Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Contributor Covenant 2.1.
