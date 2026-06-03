# Always-on check: Failure Semantics & Observability

> "When this code fails — and it will — does the system stay debuggable, and does it tell the truth about what happened?"

This runs on **every** PR, not just high-surface ones. It is the lightweight, always-on version of Lens 1 (Silent failures). The deep Lens 1 pass still runs in Step 6 for high-surface PRs; this is the floor for everything else.

> Commands use `origin/$BASE` — the PR's base branch, resolved in the SKILL's Step -1 (defaults to `main` only if unresolved). Never hardcode the base.

## Why this isn't folded into one of the 5 standards

The 5 standards own drift, conflict, security patterns, architecture conventions, and test enrollment. None of them owns *failure behavior*. Historically that meant a contextless 500 or a swallowed exception got mis-filed under "Architectural Alignment" (see the sample-pr eval — BLOCKER 2 lives here, not in Standard 4). Giving it an explicit home removes the taxonomy seam.

## Hard rules (BLOCKER on violation)

### Contextless 500s
- Any `catch` that returns a generic 5xx MUST:
  1. Capture to the error tracker with context tags: `Sentry.captureException(err, { tags: { feature: "<area>" } })` (or your equivalent).
  2. Attach a correlation/error ID to the response so a user report maps to a log line.
- A bare `console.error(...)` followed by `return ... 500` is a BLOCKER. The next incident is grep-only.
- Search:
  ```bash
  git diff origin/$BASE...HEAD | grep -E 'status: 500|statusCode.*500|HTTPStatus\.(INTERNAL|500)' -B 8 | grep -iE 'console\.(error|log)|print\(' 
  ```

### Swallowed exceptions on data paths
- `catch {}`, `.catch(() => null)`, `.catch(() => {})`, `except Exception: pass` on a write/mutation path that then continues as if the call succeeded is a BLOCKER — it corrupts downstream state silently.
- Search:
  ```bash
  git diff origin/$BASE...HEAD | grep -E '\.catch\(\(\) => (null|\{\}|undefined)\)|catch \{\s*\}|except[^:]*:\s*pass'
  ```

### Partial success returning 200
- Batch / multi-item operations that skip or fail individual items MUST report per-item outcomes (`{ ok, skipped: [...], errors: [...] }`), not collapse to a blanket `{ ok: true }`. A caller that sent 10 items and got 200 will assume all 10 landed.

## Soft rules (FLAG)

### Fail-closed must be distinguishable from fail-by-design
- A rate limiter or auth check that fails closed on an infra outage should return a response *shape* distinct from a normal denial, so a DDB/Redis outage doesn't masquerade as ordinary throttling. (Deep version in Lens 1; here, just flag same-shape conflation.)

### Logging hygiene
- New `console.log` / `print()` on a hot path without a structured logger — FLAG.
- Logging full request/response bodies, tokens, or PII — FLAG (cross-references Security Review's logging rule).

### Narrow exception classes
- Python handlers that catch only `HTTPError` (missing `URLError` / timeouts) or a single narrow class where the real failure modes are broader — FLAG here, BLOCKER if the path is high-surface (Lens 1 owns the deep case).

## What this check does NOT own

- Trust-boundary security (Standard 3 / Lens 2).
- The deep silent-failure semantics for auth/Lambda/concurrent-write surfaces (Lens 1 in Step 6) — this is the always-on floor, not the ceiling.
