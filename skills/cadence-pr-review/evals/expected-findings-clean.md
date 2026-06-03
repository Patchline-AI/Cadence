# Expected findings — clean-pr/

**This fixture must produce `VERDICT: PASS — 0 blockers, 0 flags`.**

It exists to calibrate the skill AGAINST false positives. A review tool used
daily drifts toward noise; if a run on `clean-pr/` invents blockers or flags,
the skill (or the harness) is over-flagging and needs tightening just as surely
as a missed real finding.

## Why each potential finding is correctly a non-issue

| Tempting "finding" | Why it is NOT a finding here |
|---|---|
| DynamoDB write | Uses `UpdateCommand` with owned-field `SET` + `expectedUpdatedAt` `ConditionExpression`. This is the canonical correct pattern. |
| Error handling | `catch` calls `captureException` with `feature` tag AND returns a typed `ERROR_CODES.INTERNAL` + `correlationId`. Not a contextless 500. |
| Concurrency conflict | `ConditionalCheckFailedException` → typed 409 with correlation id. Surfaced, not swallowed. |
| Input validation | `zod.safeParse` at the boundary, typed 400 on failure. |
| Auth | `getCurrentUser` gate returns 401 when absent. |
| Test coverage | Happy path AND the concurrency failure mode are both covered, and the conflict test asserts `=== 409` deterministically (the dependency boundary is stubbed so the 409 branch actually fires). |
| Brand/colors, naming | No raw hex; `use-`/PascalCase/SCREAMING_SNAKE conventions respected. |

## The `vi.mock` calls are NOT a "no-mocks-for-data" violation

`route.test.ts` mocks `@/lib/db/client`, `@/lib/auth`, etc. Per `references/test-coverage.md`, the "no mocks for data" hard rule is scoped to **integration/system tests** — it forbids mocking the AWS SDK in a test that's supposed to hit real infrastructure. This is a **colocated route unit test** (an explicitly recognized pattern in that same reference), and stubbing the client boundary is the only way to exercise the `ConditionalCheckFailedException` → 409 branch deterministically. Flagging this as a Standard-5 violation is a calibration failure.

## Acceptable NOTES (do not count as flags)

A reviewer MAY emit a NOTE on:
- The speculative composite-key observation (`{ id, userId }` write key) — only confirmable against the table's key schema, which isn't in the diff. Non-falsifiable here, so NOTE at most.

**This fixture must produce `VERDICT: PASS — 0 blockers, 0 flags`. Any BLOCKER or FLAG is a calibration failure.**
