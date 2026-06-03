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
| Test coverage | Happy path AND the concurrency failure mode (409 branch) are both covered. |
| Brand/colors, naming | No raw hex; `use-`/PascalCase/SCREAMING_SNAKE conventions respected. |

## Acceptable NOTES (do not count as flags)

A reviewer MAY emit at most a NOTE on:
- The `[409, 200]` assertion in the concurrency test being loose (a stricter unit test would force 409). Informational only — the integration layer is assumed to assert the exact code.

Any BLOCKER or FLAG on this fixture is a calibration failure.
