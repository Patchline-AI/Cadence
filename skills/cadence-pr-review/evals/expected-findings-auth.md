# Expected findings — auth-pr/

Calibration set for the **Lens 2 (Security)** angle on an auth surface. `evals/auth-pr/admin-auth.ts` is high-surface (auth module), so the trio is mandatory. A correct run must surface ALL of BLOCKER 1–4. The two NOTES are credit, not required.

> Fictional path: `lib/admin-auth.ts`.

## BLOCKER 1 — JWT verification missing `aud` / `client_id` validation (Lens 2)

**Locator:** `jwtVerify(token, JWKS, { issuer: ... })` — no `audience` option.
**Why:** Without `aud` (id tokens) or `client_id` (access tokens) validation, a token minted for **any** App Client in the same Cognito User Pool passes. The admin gate trusts tokens it should reject.
**Fix:** Pass `audience: <allowlisted client id(s)>` (or assert `payload.client_id` against an allowlist for access tokens).

## BLOCKER 2 — `email_verified` not enforced + `cognito:username` email fallback (Lens 2)

**Locator:** `const email = (payload.email as string) || (payload["cognito:username"] as string)`.
**Why:** Two compounding holes. (1) `email_verified` is never checked, so a JWT issued with an unverified email can match the admin allowlist. (2) `cognito:username` is the Cognito-internal username — an attacker can register with an admin's email *as their username*, getting a JWT whose `cognito:username` equals an admin email while `email` is something else.
**Fix:** Require `payload.email_verified === true` before the allowlist check, and use `payload.email` only — never `cognito:username` as an email source.

## BLOCKER 3 — `token_use` enforced only when present (Lens 2)

**Locator:** `if (tokenUse && tokenUse !== "access") return null`.
**Why:** When the `token_use` claim is absent, the guard short-circuits and the token passes. The check must be unconditional.
**Fix:** `if (!tokenUse || tokenUse !== "access") return null`.

## BLOCKER 4 — Single-secret blast radius (Lens 2)

**Locator:** `ADMIN_ACTION_SECRET` used by `authorizeAction`, gating both routine step-up and destructive reset per the module comment.
**Why:** One env var gates a routine surface AND a destructive one. Compromise of the secret grants both capabilities.
**Fix:** Distinct secrets per criticality tier; the destructive action gets its own, separately-rotated secret.

## FLAG 5 — Step-up cookie: 24h TTL, no identity binding, no pinned domain (Lens 2)

**Locator:** `setStepUpCookie` — `maxAge: 24h`, no `domain`, no bind to `userId`.
**Why:** A 24h step-up window is a long replay surface; with no binding to the Cognito `sub` and no pinned `domain`, a captured cookie replays freely and can leak across subdomains.
**Recommendation:** TTL ≤ 30 min for step-up, bind the cookie to `userId` (reject when undefined), set an explicit canonical `domain`.

## NOTE — `process.env.X!` non-null assertions

Several `process.env.*!` assertions will throw opaquely at module load if unset. A typed env-validation step would fail louder and earlier.
