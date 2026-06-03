# Standard 3: Security Review

> "Are trust boundaries respected? Are controls fail-closed?"

_Commands use `origin/$BASE` — the PR's base branch, resolved in the SKILL's Step -1 (defaults to `main` only if unresolved). Never hardcode the base._

## Hard rules (BLOCKER on any violation)

### API secret handling
- All API secret access goes through your codebase's masked-helper module.
- Search for violations: `git diff origin/$BASE...HEAD | grep -E 'console\.(log|error|warn).*(sk_(live|test)|api_key|access_key)'`
- Search for violations: `git diff origin/$BASE...HEAD | grep -E 'process\.env\.[A-Z_]*SECRET[A-Z_]*' | grep -v '<your-secret-helper-module>'`
- Webhook handlers must verify signatures before trusting payloads.

### DynamoDB concurrent writes
- Hard rule on concurrent-write rows on hot tables:
  - Prefer `UpdateCommand` with explicit `SET <fields>` over `PutCommand` full-row replace.
  - If `PutCommand` is unavoidable, an `expectedUpdatedAt` concurrency guard MUST be present:
    - `ConditionExpression: 'attribute_not_exists(updatedAt) OR updatedAt = :expectedUpdatedAt'`
    - On `ConditionalCheckFailedException`, surface a "project changed elsewhere — refresh" UX, never swallow.
  - The legacy `updatedAt <= :ts` shape is a false guard — flag it.
- Reference impl: the reference implementation in your codebase that demonstrates the optimistic-concurrency pattern.
- Search for read-modify-write of hot-list fields without guard:
  ```bash
  git diff origin/$BASE...HEAD | grep -E 'UpdateCommand|PutCommand' -A 20 | grep -E '<your-hot-list-fields>' -B 5
  ```

### AWS env-vars
- Some platforms (AWS Amplify, Vercel) block env-var names starting with reserved prefixes — verify your platform's reserved list.
- Lambda env-var changes via your platform's safe env-var script, NEVER raw `aws amplify update-app --environment-variables` (which replaces all vars).

### Cognito / JWT
- Changes to auth middleware or auth helpers require an audit trail in the PR description.
- `update-user-pool-client` calls must include `--explicit-auth-flows` (omitting it wipes all flows).
- **JWT verification MUST validate `aud` (id tokens) or `client_id` (access tokens).** Without it, a token from any App Client in the same Cognito User Pool passes. Search for violations: `grep -rn 'jwtVerify\|verifyJwt\|aws-jwt-verify' lib/ | grep -v 'audience\|client_id'` — any hit needs an explicit allowlist.
- **`token_use` claim MUST be enforced unconditionally.** Pattern `if (tokenUse && tokenUse !== expected)` silently passes when the claim is absent. Use `if (!tokenUse || tokenUse !== expected) throw`.
- **Admin email gates MUST check `email_verified === true`** before whitelist comparison. Cognito allows JWTs to be issued with unverified emails depending on PreSignUp/PostConfirmation lambdas.
- **Never use `cognito:username` as an email fallback.** That claim is the Cognito-internal username, which can be set to any string at signup. An attacker registering with an admin's email as their chosen username gets a JWT where `cognito:username` matches an admin email even though `email` is something else.
- (May 2026 field test: an admin-auth module shipped with `(payload.email as string) || (payload['cognito:username'] as string)` and no `email_verified` check — caught by the Security lens, not the 5-standard pass.)

### Step-up sessions / sensitive-action cookies
- **Step-up cookie MUST bind to `userId` (Cognito `sub`) on BOTH sides.** `if (a.userId && b.userId && a.userId !== b.userId)` is wrong — when either side is missing, the check silently skips. Either reject early when `userId` is undefined, OR fall back to email-only with a louder warning.
- **TTL ≤ 30 minutes for sensitive operations.** 24h is too long for a step-up.
- **`secure: process.env.NODE_ENV === 'production'`** — fine, but watch for staging/dev cookies leaking into production via misconfigured cookie `domain`. Always set explicit `domain` to the canonical hostname.
- **Single-secret blast radius: detect when ONE env var gates BOTH a routine surface (step-up) AND a destructive surface (nuclear reset / cascading deletes).** Compromise of the secret = both capabilities. Use distinct env vars per criticality tier.

### Public-endpoint rate limiting + body parsing
- **Identity hash for rate limiting MUST NOT include User-Agent.** UA is trivially rotated per request, giving the attacker a fresh bucket per call. Use IP-only OR IP-block + a captcha token for unauthenticated endpoints.
- **Body-size check MUST happen BEFORE `formData()` / `arrayBuffer()`.** These methods buffer the entire body into memory. If rate limit is bypassed (UA rotation, multi-IP), 100 concurrent 50MB uploads = 5GB Lambda memory pressure. Pattern: `const cl = Number(request.headers.get('content-length') || '0'); if (cl > MAX) return 413` BEFORE the parse.
- **Distinguish `closed-fallback` from `rate-burst` in the response.** A DDB outage that fails closed should NOT return the same 429 shape as a real burst — production goes into a 429-storm with no operational signal beyond a Sentry needle. Pattern: return `{ ok: false, retryAfterSec: N, fallback: 'closed' }` and have the route emit a 503 OR a much higher `Retry-After` when it sees the closed signal.

### Concurrent-write / lock-takeover semantics
- **TTL-based lock takeover (`expires_at < :now`) is vulnerable to client clock skew.** Two Lambda invocations with skewed clocks can both claim the lock during the original holder's window. Either: use a DDB-server-generated timestamp, or drop the takeover path and surface to operator instead of self-healing.
- **`PutCommand` full-row replace on a list-shaped attribute** — wholesale `SET #field = :field` silently drops concurrent writes from differently-shaped writers. Use `list_append` semantics OR ensure ALL writers go through a single concurrency-guarded service.

### Sentry / debug endpoints
- Every internal-debug endpoint guarded by the auth-guard helper for your internal endpoints (every internal-debug endpoint must be guarded or 404'd in production).
- (reference: a public-debug-endpoint incident — every internal probe burned a Sentry quota event before the guard landed).
- Search: `git diff origin/$BASE...HEAD | grep -E 'export.*async.*function (GET|POST)' -A 5 | grep -v 'is_authorized_internal\|getCurrentUser\|api-auth'`

## Soft rules (FLAG)

### CSRF on mutating routes
- POST/PUT/DELETE routes should respect CSRF protection in your auth middleware. Bypass with caution.

### User input validation at boundaries
- Body parsing should validate shape (zod or typed parser). Don't rely on TypeScript types at runtime.

### Logging of user data
- `userId`, email — fine. Full message bodies, payment details — flag.

## What this standard does NOT enforce

- Crypto choices (out of scope; defer to separate audit).
- Dependency vulnerabilities (use `pnpm audit`, `gh dependabot`, separate sweep).
