# Expected findings — lambda-pr/

Calibration set for the **Lens 1 (Silent failures)** angle on a Python serverless surface. A correct `cadence-pr-review` run on `evals/lambda-pr/handler.py` — recognized as high-surface (Lambda code) so the trio is mandatory — must surface BOTH of the following. Missing either means the silent-failure lens isn't firing on Python.

> Fictional path: `backend/lambda/analysis_callback/handler.py`.

## BLOCKER 1 — `urllib.error.URLError` not caught (Lens 1, Silent failures)

**File:** `backend/lambda/analysis_callback/handler.py`
**Locator:** the `try: urlopen(...) except HTTPError as e:` block.
**Why:** Only `HTTPError` is caught and tagged for Sentry. `URLError` (DNS failure, TCP refusal, timeout) is the most likely failure mode for an outbound HTTP call, and it escapes this handler with **no** `feature: analysis.callback` context tag. The on-call engineer loses the api-context breadcrumb on the exact failures that page them.
**Fix:** Catch `URLError` (the parent of `HTTPError`) — or `(HTTPError, URLError, TimeoutError)` — and capture with the same tags. Distinguish the two if the response shape matters.

## BLOCKER 2 — Secret-fallback gate predicate fires too easily (Lens 1, Silent failures)

**File:** `backend/lambda/analysis_callback/handler.py`
**Locator:** `_get_secret()` — `if os.environ.get("AWS_EXECUTION_ENV") or not LOCAL_NOTIFY_SECRET: raise`.
**Why:** On a Secrets Manager outage, the code re-raises only when running in Lambda OR when the local env var is unset. Any **staging/dev** runtime that has `LOCAL_NOTIFY_SECRET` set silently switches to the local secret instead of failing loud — a real outage masquerades as normal operation, and a stale/dev secret can leak into a near-prod call.
**Fix:** Fail closed everywhere by default. If a local fallback is genuinely needed, gate it on an explicit `ALLOW_LOCAL_NOTIFY_SECRET` flag (never on the mere presence of the secret) and emit a loud warning + Sentry breadcrumb when the fallback path is taken.

## NOTE — `event["assetId"]` unguarded

**File:** `backend/lambda/analysis_callback/handler.py`
**Locator:** `event["assetId"]` in `handler`.
**Why:** A malformed event raises `KeyError`, surfacing as a generic Lambda error with no context. Non-blocking, but a typed validation + tagged capture would improve debuggability.
