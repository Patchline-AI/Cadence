---
name: cadence-pr-review
description: Run the five Agent Review Standards against the current branch diff before opening a PR — Codebase Drift Detection, Conflicting PR Detection, Security Review, Architectural Alignment, Test Coverage Assessment — applied with concrete pattern checklists (concurrent-write rows, secret handling at boundaries, multi-agent config drift, real-data integration tests, test-suite enrollment). On every PR, additionally run the inline review lenses against the same diff — silent failures, security semantics, test-coverage semantics, plus the extended lenses (migration, idempotency, dependency, rollout) — per `references/specialist-trio.md`; apply maximum scrutiny on HIGH-SURFACE PRs (auth/Lambda/concurrent-write/public-endpoint, OR a PR that has absorbed another PR). When another agent (Codex, etc.) pastes a "completion summary" or "PR opened" message, run the trust-but-verify drill in `references/scope-change-detection.md` BEFORE re-reviewing — scope often grew silently. Use BEFORE opening any PR, BEFORE merging, when reviewing another agent's PR completion summary, or whenever the user types `/cadence-pr-review`, "review my branch", "is this PR safe", "run the review standards", "another agent finished, here's the summary", or hands you a diff and asks "what's wrong with this." Trigger automatically when the assistant has just finished an edit-heavy turn that touched route handlers, service modules, lambda/serverless code, agent-orchestration config, auth middleware, secret-handling modules, auth modules, JWT/token-verification code, crypto-bound subsystems, or any rate-limit module.
---

# Cadence PR Review

You are running pre-PR review against the current branch's diff. Your job is to surface blockers, flag risks, and recommend gates BEFORE the human reviewer sees the PR. Run the COMPLETE review on every PR — all five standards, the always-on failure-semantics check, the full trio, and every extended lens — at maximum rigor, on a frontier model with full reasoning/thinking. Review is no place to economize: never skip a pass, never shorten coverage to save time.

**Announce at start:** "I'm using the cadence-pr-review skill."

## First-run calibration (once per repo)

The reference docs use generic placeholders (`your secret-handling module`, `your test-suite-map`, etc.). If `.cadence/profile.md` exists in the repo under review, read it and substitute its values — it tells you the base branch, the hot tables, the high-surface paths that make Step 6 mandatory, and where services/secrets/tests live. If it doesn't exist, run the calibration in `reference/calibration.md` (at the Cadence plugin/repo root — one level above the `skills/` dir; symlink-install users will find it at the cloned Cadence repo root) first (~2 min) so this review is sharp instead of generic.

## Source of authority

The five standards and their concrete pattern checklists are documented in:
- `references/*.md` (one detail file per standard, focused checklists)

Cross-reference each standard's reference doc. Don't skip a standard because the diff "looks small."

## Step -1 — Resolve the base branch FIRST (do not assume `main`)

Every command in this skill and its references compares the branch against a base. **Resolve the base once, up front. Never hardcode `origin/main`** — many repos use `master`, `develop`, or a per-PR base, and a wrong base makes the entire review silently compare against the wrong tree without erroring.

```bash
# Prefer the PR's declared base; fall back to the remote default; last resort 'main'.
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null \
  || git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' \
  || echo main)
echo "Reviewing against origin/$BASE"
git fetch origin "$BASE"
```

Throughout this skill and its references the base is written `origin/$BASE` (resolved above). `main` appears only as the fallback when resolution fails — never as a hardcoded assumption.

## Step 0.5 — Triage before you review (large diffs)

At agentic velocity, diffs are often huge. Before deep-reviewing:

```bash
git diff origin/$BASE...HEAD --stat | sort -t'|' -k2 -rn   # biggest churn first
```

Triage sets the **order** you review in. It NEVER reduces coverage — every file gets a full review.

1. **Rank files by risk, not by size.** Review in this order: auth / token-verification → serverless/Lambda → concurrent-write paths → public unauthenticated endpoints → payment/secret handling → everything else. Then keep going until every file is reviewed.
2. **Generated/vendored artifacts** (lockfiles, `*.snap`, generated clients, `dist/`, minified bundles) get no line-by-line read — there is no human-authored logic to review — but they are NOT skipped: scope-check them in Standard 1 (a generated file moving on the base is real drift) and run Lens 6 on any dependency manifest.
3. **A large diff means a LONGER review, not a shorter one.** Never stop at a budget and mark the rest "not reviewed." If the diff is too large for one pass, split it into multiple review passes and review every file fully across them. Coverage is non-negotiable.

## Inputs

Read these BEFORE running any standard (with `$BASE` resolved in Step -1):

```bash
# The diff under review
git diff origin/$BASE...HEAD --stat       # touched-files summary
git diff origin/$BASE...HEAD              # full diff for inspection

# Branch + commit context
git log --oneline origin/$BASE..HEAD      # commits on this branch
git rev-parse --abbrev-ref HEAD           # branch name
```

If `gh` is available:

```bash
gh pr list --state open --json number,title,files,headRefName --limit 30
```

## Step 0 — Scope-change check (when reviewing an agent's completion summary)

If you're being asked to review a PR after another agent (Codex, etc.) finished work and pasted a "completion summary," **run the trust-but-verify drill in `references/scope-change-detection.md` BEFORE re-running any review**. The drill takes 2 minutes:

1. Take ops markers (`::git-commit`, `::git-push`, `::git-create-pr`) at face value (the runtime executed them); take natural-language claims as unverified.
2. `git fetch origin` + diff against the commit you originally reviewed: `git diff --stat <ORIG_TIP> origin/<branch>`.
3. If delta is 5+ commits, OR 500+ lines, OR includes a different feature scope (e.g. an unrelated PR merged in), **scope grew silently — re-run the full review on the delta, including Step 6**.
4. If delta is small and on-scope, re-review only the changed files with the 5 standards.

**Reference case** (May 2026 field test): an agent's summary said "addressed the only architecture flag." Reality: 7 new commits, +2,500 lines, an unrelated feature PR merged in (admin-auth surface entered scope). Skipping the scope-change check would have rubber-stamped 4 hidden BLOCKERS.

## Run EVERY pass — at maximum rigor, no skipping

Review is not where you economize. **Run every pass on every PR:** all 5 standards, the always-on Failure-Semantics check, the full trio (Lenses 1–3), and all extended lenses (4–7). There is no "core vs. optional." There is no "skip it because the diff looks small." Run this skill on a frontier model with maximum reasoning/thinking enabled — review is no place to trade depth for speed.

The trigger lists later in this skill (high-surface conditions, diff patterns) tell you **where a pass bites hardest — never whether to run it.** If a pass's trigger isn't present in the diff, you STILL run the pass and record one line — `N/A — no <trigger> in this diff` — so the review is provably complete. A pass that finds nothing is a pass that *ran*. A pass that was skipped is a hole an incident falls through.

The only thing that varies by diff is the **order** you review files in (highest-risk first, per Step 0.5) and how much each pass finds. Coverage never varies: it is always 100%.

## The five standards — run all five, in order

### 1. Codebase Drift Detection
"Is the PR patching code that has moved or been restructured upstream while the branch was open?"

See `references/codebase-drift.md` for the full checklist.

Quick check:
```bash
git log --oneline HEAD..origin/$BASE -- $(git diff origin/$BASE...HEAD --name-only)
```

If any output: the branch is patching files that moved on the base. Flag as BLOCKER.

### 2. Conflicting PR Detection
"Does this overlap with, contradict, or duplicate another open PR?"

See `references/conflicting-prs.md`.

Quick check:
```bash
gh pr list --state open --search "$(git diff origin/$BASE...HEAD --name-only | head -3)"
```

Common overlap risks: serverless-function config blocks, agent-orchestration config, database schema for hot tables, shared service-module singletons.

### 3. Security Review
"Are trust boundaries respected? Are controls fail-closed?"

See `references/security-review.md` for the full checklist.

Hard rules (ANY violation = BLOCKER):
- No raw `console.log()` of API secrets, AWS keys, or auth tokens. API secrets must use masked helpers from your secret-handling module.
- DynamoDB writes on concurrent-write rows on hot tables: prefer `UpdateCommand` with explicit `SET <fields>`. If `PutCommand` is used, an `expectedUpdatedAt` concurrency guard MUST be present (the reference implementation in your codebase that demonstrates the optimistic-concurrency pattern).
- AWS env vars: some platforms (AWS Amplify, Vercel) block env-var names starting with reserved prefixes — verify your platform's reserved list.
- Lambda env-var changes go through your platform's safe env-var script, never raw `aws amplify update-app --environment-variables`.
- Any new internal-debug endpoint must be guarded by the auth-guard helper for your internal endpoints (every internal-debug endpoint must be guarded or 404'd in production).

### 4. Architectural Alignment
"Does this move toward the target architecture or away from it?"

See `references/architectural-alignment.md`.

Patterns to enforce:
- Service files: follow the codebase's existing service-file naming + singleton convention; deviation is a flag.
- Stores: follow the codebase's store-file naming.
- Hooks: `use-kebab-case.ts`.
- Brand colors come from the codebase's design-token / brand-constants module, never raw hex.
- Asset metadata writes: follow the codebase's primary-store + fallback hierarchy.
- Lambda deploys: follow the codebase's deploy script conventions; misuse is a flag.
- Verify the container entrypoint matches the deploy target; mismatched CMD is a deploy-stale trap.

### 5. Test Coverage Assessment
"Do the tests prove behavior or just prove intent?"

See `references/test-coverage.md`.

Hard rules:
- **No mocks for data** in integration/system tests. Real APIs, real S3, real DynamoDB, real upstream services.
- Any new test file must be in your test-suite-map OR a feature-map bundle, otherwise the quality-pipeline won't run it.
- Bug fixes touching user-facing behavior or data writes MUST include a regression test that would have caught the bug.
- Tests should exercise the failure mode, not just the happy path.

## Always-on check — Failure Semantics & Observability

The 5 standards check drift, conflict, security patterns, architecture conventions, and test enrollment. None of them owns **what happens when code fails**. That gap is why observability findings used to get shoehorned into "Architectural Alignment." This is the lightweight, always-run version of Lens 1 (the high-surface deep version still runs in Step 6). Run it on **every** PR, not just high-surface ones.

See `references/failure-semantics.md` for the full checklist.

Hard rules (BLOCKER on violation):
- **No contextless 500s.** A `catch` that returns a generic 500 MUST capture to your error tracker (`Sentry.captureException` or equivalent) AND attach a correlation/error ID to the response. A bare `console.error(...)` + `500` leaves the next incident grep-only — BLOCKER.
- **No swallowed exceptions on data paths.** `catch {}`, `.catch(() => null)`, `.catch(() => {})` on a write/mutation path that lets execution continue as if it succeeded is a BLOCKER (corrupts downstream state silently).
- **Partial success must not return 200.** Batch/multi-item operations that skip or fail items must report per-item outcomes, not collapse to a blanket `{ ok: true }`.

Soft rules (FLAG):
- Fail-closed controls (rate limit, auth) should be **distinguishable in the response** from fail-by-design, so an outage doesn't look like normal throttling.
- New `console.log`/`print` on hot paths without a structured logger — FLAG.

## Step 6 — Specialist Trio (run on EVERY PR)

The 5 standards check **patterns**. They miss **semantics**. So you ALWAYS run three additional review passes against the same diff, each with a different lens. These run as inline reviews in the same skill — no external subagents required. Run them on every PR; if the diff has no relevant surface, each lens reports `N/A — no <surface> in this diff` (one line) — it is never skipped.

### Where the trio bites hardest (review here with extra scrutiny)

The trio always runs. These conditions mark where its findings are most load-bearing — apply maximum scrutiny when **any** hold:

1. Scope-grew check fired in Step 0 (PR has absorbed another PR / +500 lines since prior baseline / +5 commits across feature boundaries).
2. Touched files match any of:
   - Auth modules (JWT/token verification, session cookies, admin gates, OAuth flows)
   - Internal-secret-gated endpoints
   - Serverless / Lambda code
   - Crypto-bound subsystems
   - Rate-limit modules
   - Any public unauthenticated endpoint with file upload
3. Diff includes any pattern: `\.catch\(\(\) => null\)` · `} catch { /\* (swallow|ignore)` · `except HTTPError` (Python) · `if .* return` early-return on infra-unavailable
4. Concurrent-write boundary touched

### How to run the trio inline

After producing the 5-standard report, run three additional review passes against the same diff. Use the lens prompts below verbatim for each pass:

**Lens 1 — Silent failures.**
Hunt for swallowed exceptions, fail-closed semantics that obscure outages, `.catch(() => null)` patterns that corrupt downstream state, partial-success returning 200, ungated observability capture (Sentry / equivalent gated only by env-var presence so dev is silent), narrow Python exception classes that miss real failure modes (e.g. `except HTTPError` without `URLError`), generic 500 returns with no correlation token. Report findings against the diff.

**Lens 2 — Security.**
Audit trust boundaries: JWT `aud` / `client_id` validation, `email_verified` enforcement, session-cookie binding to identity claims, single-secret blast radius (one env var gating two surfaces of different criticality), identity-hash bypass on rate limiters (e.g. UA included in identity = trivial rotation bypass), body-buffer DoS (oversized body parsed before rate-limit check), lock-takeover clock-skew, info disclosure via response shapes that leak internal IDs. Report findings against the diff.

**Lens 3 — Test coverage semantics.**
Audit test-vs-implementation composition: each layer mocked individually but never composed end-to-end, public-endpoint pre-auth gates added but only tested via integration runners that fail at an earlier gate and never reach the new one, regression tests missing for the failure modes the PR claims to fix, mismatched-field branches uncovered (e.g. `body.userId !== resource.userId` returning 409 but the path has no test), expired-credential branches uncovered. Report findings against the diff.

### Extended lenses 4–7 (run all four on EVERY PR)

Four more lenses catch production-risk classes the trio doesn't. Run all four on every PR. The trigger noted for each tells you where it bites — it does NOT gate whether you run it. If a lens's trigger isn't in the diff, record `N/A — no <trigger> present` (one line) and move on; never skip silently. Full checklists in `references/specialist-trio.md` ("Extended lenses").

**Lens 4 — Data migration & backward compatibility.** Trigger: diff touches a schema, migration, enum, serialized contract, or any public API response shape. Hunt for: non-nullable column/field added without a default or backfill, enum value removed/renamed, response field removed or retyped (breaks existing clients), migration that isn't reversible, read/write deploy-ordering hazards (new code reads a column the migration hasn't added yet).

**Lens 5 — Idempotency & retry safety.** Trigger: mutating endpoint, webhook handler, queue consumer, or payment path. Hunt for: no idempotency key on a retryable mutation, webhook with no replay/dedup guard, at-least-once delivery treated as exactly-once, non-idempotent side effects (double-charge, double-send) on retry.

**Lens 6 — Dependency & supply chain.** Trigger: lockfile or manifest changed. Hunt for: new direct dependency (name it, note why it entered), unpinned/`*`/`latest` ranges, a large transitive tree from one small package, a dependency duplicating something already vendored. (Deep CVE scanning stays a sweep; this is the gate-time "what entered and why" check.)

**Lens 7 — Rollout & reversibility.** Trigger: risky behavior change, data backfill, or anything hard to undo. Hunt for: no feature flag / kill switch on a risky path, no rollback plan for a destructive migration, change that can't be dark-launched, all-or-nothing cutover where a staged one was possible.

### Severity calibration

Use each lens's findings at the severity it returns. **Do not downgrade a lens-flagged BLOCKER to FLAG** because the 5 standards passed cleanly — that's the reason the lenses exist.

### Reference field test (May 2026)

5 standards alone returned 0 BLOCKERS, 1 FLAG on a real high-surface PR. Adding the three inline lenses surfaced **4 BLOCKERS, 16 FLAGS, 7 NOTES** — including a rate-limit fail-closed-as-throttle conflation, a Python `urllib.error.URLError` bypass in a Lambda handler, a secret-fallback gate predicate, and a public endpoint whose magic-byte sniff was untested at unit level.

## Output format

See `references/output-format.md`.

Produce a single markdown report with this structure:

```markdown
# PR Review: <branch-name>

**Diff summary:** N files changed (+X / -Y)
**Touched areas:** [billing | catalog | projects | upload | chat | aws-data-path | sentry | tests | docs]

## Blockers (must fix before merge)
- [ ] STANDARD: <finding>
  - File: `path/to/file.ts:LINE`
  - Why: <one-sentence>
  - Fix: <one-sentence>

## Flags (review carefully)
- [ ] STANDARD: <finding>
  - File: `path/to/file.ts:LINE`
  - Why: <one-sentence>
  - Recommendation: <one-sentence>

## Required gates
- [ ] Run `<exact command>`
- [ ] Manual verification: <what to check>

## Notes
<anything else worth surfacing — non-blocking>
```

Severity rule: BLOCKER if violation of a hard rule from any standard, FLAG if pattern divergence with credible business reason, NOTE if stylistic.

**Order blockers by blast radius** (most-likely-to-ship-and-hurt first), not by standard number — the human needs a fix order, not a checklist order. When you assert a finding, cite the exact `file:line` and a falsifiable reason; a finding you can't anchor to a line is a NOTE, not a BLOCKER.

## Acceptance: against the sample-pr fixture

Run yourself against `evals/sample-pr/` and verify your report flags ALL five of:
1. Concurrency guard missing on a database write that uses a full-row replace pattern (Standard 3, BLOCKER)
2. Generic 500 with no Sentry capture and no error ID (Failure Semantics & Observability, BLOCKER)
3. Item-size risk — large nested objects embedded per record without a size cap (Standard 4, FLAG)
4. Missing regression test for the stale-write race the fix claims to address (Standard 5, BLOCKER)
5. Owned-field `SET` pattern not used — write replaces broader fields than necessary (Standard 4, FLAG)

If your report misses any of these, the skill needs tightening. See `evals/expected-findings.md` for the canonical list.
