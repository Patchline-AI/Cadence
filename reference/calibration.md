# First-run calibration

> The skills ship with **generic placeholders** (`your secret-handling module`,
> `your test-suite-map`, `your hot-list fields`). A fresh install reviews
> against generic patterns; it gets dramatically sharper once it knows your
> repo's specifics. Calibration is how you teach it — once per repo.

All three Cadence skills point here. Run this the first time you use Cadence in
a repo (and re-run after a big restructure). It takes ~2 minutes and produces a
small `.cadence/profile.md` the skills read on every invocation.

## The auto-detect pass

Run these against the target repo and record the answers. Most are one command.

```bash
# Base branch (cadence-pr-review Step -1 uses this)
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'

# Package manager / language
ls pnpm-lock.yaml yarn.lock package-lock.json 2>/dev/null     # JS PM
ls requirements*.txt pyproject.toml go.mod Cargo.toml 2>/dev/null  # other stacks

# Test runner(s)
rg -l "vitest|jest|pytest|go test|cargo test" package.json pyproject.toml 2>/dev/null

# Where services / stores / hooks live (architecture conventions)
git ls-files | rg "^(lib/services|src/services|app/|hooks/|stores?/)" | sed -E 's@/[^/]+$@@' | sort -u | head

# Secret-handling module (Security Standard)
rg -l "getSecret|secretsmanager|maskSecret|process\.env.*SECRET" lib/ src/ 2>/dev/null | head

# Test-suite map / feature map (Test Coverage Standard)
git ls-files | rg -i "suite.?map|feature.?map|test.?manifest|qa.*config"

# Drift log / incident memory (Codebase Drift Standard + research Move 2)
ls CLAUDE.md AGENTS.md ADR* docs/postmortems docs/decisions 2>/dev/null

# Design-token / brand module (Architectural Alignment)
rg -l "tokens|brand|theme|colors" lib/ src/ styles/ 2>/dev/null | head

# Error tracker (Failure-Semantics check)
rg -l "Sentry|datadog|rollbar|captureException" 2>/dev/null | head
```

## The profile

Write the findings to `.cadence/profile.md`:

```markdown
# Cadence profile — <repo>

- Base branch: <main|master|develop>
- Package manager: <pnpm|npm|yarn|pip|poetry|go|cargo>
- Test runner(s): <vitest|jest|pytest|...>
- Service dir: <lib/services/>          · naming/singleton convention: <...>
- Store dir: <stores/>                  · Hook dir: <hooks/>
- Secret-handling module: <lib/secret-env.ts>
- Test-suite map: <path>                · Feature map: <path>
- Drift log / incident memory: <CLAUDE.md | docs/postmortems/>
- Design-token / brand module: <lib/brand.ts>
- Error tracker: <Sentry | none>
- Hot tables (concurrent-write): <Projects-prod, Releases-staging, ...>
- High-surface paths (auto-trigger the trio): <app/api/public/**, backend/lambda/**, lib/auth*, *rate-limit*>
```

## How the skills use it

- `cadence-pr-review` substitutes the profile values for the generic placeholders in the reference docs, resolves `$BASE` from the profile, and uses "High-surface paths" to decide when Step 6 (the trio) is mandatory.
- `cadence-research` uses the drift-log path for Move 2 and the service/store/hook dirs for Move 1.
- `cadence-sweep` uses the test-suite map for the orphan/enrollment sweeps and the hot-tables list for the concurrency recurrence checks.

## Making it durable

Direct edits inside the plugin cache get overwritten on reinstall/update. The
`.cadence/profile.md` lives in **your repo**, not the cache, so it survives. If
your patterns become team policy, also fold them into the reference docs of a
**forked/vendored** copy of Cadence (see README → Customizing).
