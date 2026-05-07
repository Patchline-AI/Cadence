# Specialist Trio — Gate-Completion for High-Surface PRs

> _The 5 NVIDIA Standards check **patterns**.
> The specialist trio checks **semantics**. For high-surface PRs, the gate is incomplete without both._

The 5 Agent Review Standards are the deterministic, checklist-style review (drift, conflict, security checklist, architecture conventions, test enrollment). They are necessary but **not sufficient** when the PR:
- Absorbed another PR via merge (scope grew beyond the original review baseline)
- Touches authentication, authorization, or session surface (JWT, Cognito, step-up, admin gate)
- Touches Lambda code, especially Python `urllib`/`asyncio`/error-handling surfaces
- Touches concurrent-write paths on concurrent-write database tables
- Touches public-facing rate-limited endpoints
- Modifies legacy `} catch { /* swallow */ }` patterns or `.catch(() => null)` patterns in services

For these PRs, **always dispatch the three specialists in parallel after the 5 standards complete**. The specialists run for ~5 minutes each; running in parallel keeps total wall-clock at ~5 min.

## The three specialists

| Specialist | What it catches that the 5 standards miss |
|---|---|
| `silent-failure-hunter` | Swallowed exceptions, fail-closed semantics that obscure infra outages, fallback-gate predicates that fire too easily, `.catch(() => null)` patterns that corrupt downstream state, partial-success paths returning 200, observability gaps without Sentry capture / Statsig event |
| `security-auditor` | Trust-boundary issues the standards' security checklist doesn't enumerate: JWT `aud`/`client_id` validation, `email_verified` enforcement, session-cookie binding (IP/UA/sub), single-secret blast radius, identity-hash bypass via UA rotation, body-buffer DoS *before* rate-limit, lock-takeover clock-skew windows, info disclosure via response field whitelisting, TOCTOU windows on read-modify-write |
| `pr-test-analyzer` | Coverage gaps the suite-map enrollment check doesn't see: layered-but-not-composed integration tests (each layer mocked individually, never composed end-to-end), public endpoint with magic-byte sniff added but tested only in vacuous integration runner, missing regression tests for the failure modes the PR claims to fix, expired-cookie / mismatched-userId branches uncovered |

## When to dispatch (decision rule)

Run the specialist trio if **any** of these conditions hold:

1. **Scope-grew check fires.** Compare current branch tip against the commit you originally reviewed:
   ```bash
   # Replace ORIG_TIP with the commit hash from your prior review
   git diff --stat ORIG_TIP origin/<branch>
   ```
   If the delta has 5+ changed files OR 500+ added lines OR commits from a different feature scope (e.g. PR #N merged in), specialists are mandatory.

2. **PR description mentions "absorbed", "incorporated", "merged in", "supersedes" another PR.**

3. **Touched files match any of:**
   - auth modules and admin/sensitive routes
   - internal-secret-gated endpoints
   - serverless / Lambda code
   - crypto-bound subsystems
   - Any file with `*-rate-limit*` in the path

4. **Diff includes any of these patterns:**
   ```bash
   git diff origin/main...HEAD | grep -E '\.catch\(\(\) => null\)|\} catch \{ /\* (swallow|ignore)|catch \(.*HTTPError\)|except HTTPError'
   ```

If any of the above match, dispatch the trio. Otherwise the 5 standards are sufficient.

## Dispatch pattern

```
# In a single message, three Agent tool calls in parallel (run_in_background: true)
Agent 1: subagent_type=silent-failure-hunter
Agent 2: subagent_type=security-auditor
Agent 3: subagent_type=pr-test-analyzer
```

Each agent receives the **delta range** to focus on, not the full PR scope. Use:
```
Working dir: <main checkout absolute path>
Diff command: git diff <baseline-commit> origin/<branch>
```

Each agent should be told: "Don't re-flag findings the 5 standards already caught — focus on what's outside that scope."

## Deduplication after the trio returns

Findings often overlap on the same file but from different angles. Keep all three angles; they're complementary, not redundant. Example matrix:

| File | silent-failure-hunter angle | security-auditor angle | pr-test-analyzer angle |
|---|---|---|---|
| `<rate-limit-module>` | Fail-closed conflated with rate burst (operational visibility) | UA rotation bypasses identity hash + 50MB body parsed before throttle (DoS) | Magic-byte sniff added to verify route is untested at unit level (regression risk) |
| `<internal-notify-route>` | `markNotified` post-email failure returns 200 (duplicate email risk) | Lock-takeover clock-skew window (race condition) | `userId mismatch → 409` branch uncovered (test gap) |
| `<attach-items-route>` | `.catch(() => null)` corrupts dedup pool | TOCTOU on read-modify-write of list-shaped attribute (legacy writer migration risk) | (no overlap — well covered) |

**Never** drop a finding because another specialist found "the same file." Each angle becomes its own row in the BLOCKER / FLAG / NOTE list.

## Severity calibration

The standards alone tend to under-report severity because patterns can be locally compliant while semantically broken. Calibration after running the trio:

- **BLOCKER** = the specialist describes a concrete failure mode (DoS, silent prod degradation, untested public surface) that ships if left unfixed.
- **FLAG** = pattern divergence or defense-in-depth gap with credible mitigation. Defer to a follow-up PR if not pre-merge.
- **NOTE** = stylistic, migration risk, or documentation gap.

Use the specialist's own severity tag as the floor. If silent-failure-hunter says BLOCKER, do not downgrade.

## Reference cases (May 2026 field test)

The 4 BLOCKERS the trio caught that the 5 standards didn't:

1. **Rate-limit fail-closed semantics** — a public verify endpoint's rate-limit module returned `{ ok: false, retryAfterSec: 1 }` on DDB outage, indistinguishable from a real burst. Endpoint went into permanent 429-storm with no operational signal beyond a Sentry needle. (Caught by silent-failure-hunter; security-auditor independently caught the UA-rotation bypass + 50MB pre-rate-limit DoS on the same file — complementary findings.)

2. **Python `urllib.error.URLError` not caught** — a Lambda HTTP-callback handler caught only `HTTPError`. `URLError` (DNS/TCP/timeout) bypassed the targeted handler — Sentry lost API-context tags on the most likely failure mode. (Caught by silent-failure-hunter; security-auditor and pr-test-analyzer don't audit Python class hierarchies.)

3. **Secret fallback gate predicate** — `os.environ.get("AWS_EXECUTION_ENV") or not LOCAL_NOTIFY_SECRET` re-raised only if running in Lambda OR env-var unset. Staging/dev runtimes with the env var set silently switched to it on Secrets Manager outage. (Caught by silent-failure-hunter only.)

4. **Public endpoint magic-byte sniff untested at unit level** — route added a magic-byte audio signature check, but the integration runner sent `text/plain` "not audio" which fails MIME check first and never reaches the magic-byte branch. Future refactor of the byte-comparison logic silently regresses past CI. (Caught by pr-test-analyzer only.)

The 5 standards on their own returned **"0 BLOCKERS, 1 FLAG"** for this PR. With the trio: **4 BLOCKERS, 16 FLAGS, 7 NOTES**. Without the trio, this PR would have shipped with all 4 blockers active in production.

## Operating rule

**For a high-surface PR, the 5 standards are the gate. The specialist trio is the gate-completion step. Don't ship without both.**
