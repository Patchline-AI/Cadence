# Expected findings — rate-limit-pr/

Calibration set for a public unauthenticated endpoint — exercises all three trio
lenses on one file, the canonical "complementary findings on the same file"
case. `route.ts` is high-surface (public rate-limited endpoint with file
upload), so the trio is mandatory. A correct run surfaces BLOCKER 1–4. The
dedup matrix below mirrors `references/specialist-trio.md`: the same file yields
distinct findings from three angles — never collapse them.

> Fictional paths: `app/api/public/verify-upload/route.ts` + colocated `route.test.ts`.

## BLOCKER 1 — Body buffered before size check (Lens 2, Security — DoS)

**Locator:** `await request.formData()` / `file.arrayBuffer()` runs before any content-length check; the `MAX_BYTES` check happens AFTER the body is already in memory.
**Why:** If the rate limit is bypassed (see BLOCKER 2), N concurrent 50MB uploads are each fully buffered before the size gate — straight to memory exhaustion.
**Fix:** `const cl = Number(request.headers.get("content-length") || "0"); if (cl > MAX_BYTES) return 413` BEFORE `formData()`.

## BLOCKER 2 — Rate-limit identity hash includes User-Agent (Lens 2, Security — bypass)

**Locator:** the `identity` hash built as `ip` joined with the `user-agent` header.
**Why:** UA is attacker-controlled and trivially rotated per request, granting a fresh bucket on every call. The rate limit is effectively absent.
**Fix:** IP-only (or IP-block + a captcha/proof token) for unauthenticated endpoints. Never mix attacker-controlled headers into the identity.

## BLOCKER 3 — Fail-closed conflated with rate-burst (Lens 1, Silent failures)

**Locator:** the `if (!rl.ok)` branch returning `{ ok: false, retryAfterSec: 1 }` with 429 regardless of WHY the limiter said no.
**Why:** A backing-store (DDB/Redis) outage that fails closed returns the exact same shape as a legitimate burst. Production goes into a 429-storm with no operational signal beyond a Sentry needle; no dashboard distinguishes outage from traffic.
**Fix:** Have the limiter return a distinct `fallback: "closed"` signal; the route emits 503 (or a much larger `Retry-After`) and an alert on the closed path.

## BLOCKER 4 — Magic-byte sniff untested at unit level (Lens 3, Test semantics)

**Locator:** `sniffAudio()` in `route.ts`; the only rejection test in `route.test.ts` sends `text/plain`.
**Why:** `text/plain` fails the `mime.startsWith("audio/")` check first and never reaches `sniffAudio()`. The byte-comparison logic has zero coverage — a future refactor of the signature offsets regresses silently past CI, making the endpoint MORE permissive than the test implies.
**Fix:** Unit-test `sniffAudio()` and the route's magic-byte branch directly:
- `audio/mpeg` MIME + non-audio bytes → 415
- `audio/wav` + `RIFF` without `WAVE` → 415
- `application/octet-stream` + valid MP3/WAV signature → reaches the sniff (200 path)
- oversized `content-length` → 413 BEFORE body parse

## NOTE — `x-forwarded-for` trusted raw

`x-forwarded-for` is client-spoofable unless the edge/proxy is trusted to overwrite it. Combined with BLOCKER 2, IP-based limiting needs a trusted-proxy assumption documented.
