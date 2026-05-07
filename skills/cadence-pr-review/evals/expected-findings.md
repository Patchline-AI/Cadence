# Expected findings — sample-pr/

A correctly-functioning `cadence-pr-review` invocation should flag ALL FIVE of the following against the files in `evals/sample-pr/` (`route.ts` and `route.test.ts`). Missing any of them indicates the skill or the model harness needs tightening.

---

> Findings are anchored by file path + the textual context of the issue. Line numbers intentionally omitted so the fixture can evolve without invalidating the calibration set.

## BLOCKER 1 — Concurrency guard missing on `Projects-prod` write (Standard 3, Security)

**File:** `app/api/projects/[id]/attach-items/route.ts`
**Locator:** the `await client.send(new PutCommand({ TableName: PROJECTS_TABLE, Item: { ...existing, items: merged, updatedAt: ... } }))` block.
**Why:** The `PutCommand` performs a full-row replace without an `expectedUpdatedAt` ConditionExpression. Two concurrent POSTs both reading the row at time T will each compute `merged` against the stale view and the second write silently wipes the first writer's items.
**Fix:** Replace `PutCommand` with `UpdateCommand` using `SET items = list_append(...)` + `ConditionExpression: "updatedAt = :expectedUpdatedAt"`. On `ConditionalCheckFailedException`, surface a "project changed elsewhere — refresh" UX. Reference: optimistic concurrency.

## BLOCKER 2 — Generic 500 with no Sentry capture, no error ID, no per-item failure semantics (Standard 4, Architectural Alignment)

**File:** `app/api/projects/[id]/attach-items/route.ts`
**Locator:** the outer `catch (err)` that does `console.error("attach-items failed:", err)` followed by `NextResponse.json({ error: "Failed to attach items" }, { status: 500 })`.
**Why:** No `Sentry.captureException`, no error ID from a constants file, no correlation token. The user has zero diagnostic information; debugging the next reported incident is grep-only.
**Fix:** `Sentry.captureException(err, { tags: { feature: "project.attach-items" } })`, attach a request-correlation token to the response, return a typed error code.

## FLAG 3 — Item-size risk: metadata duplicated 3× per item (Standard 4, Architectural Alignment)

**File:** `app/api/projects/[id]/attach-items/route.ts`
**Locator:** the `enrichedItem` construction inside the `for (const item of items)` loop, where `metadata`, `analysisData`, and `searchIndex` all alias `item.metadata`.
**Why:** Each item's `metadata` is stored under three keys (`metadata`, `analysisData`, `searchIndex`). For large metadata blobs (analysis output, embeddings), this is 3× row size and risks DynamoDB's 400KB item-size limit. Also a write-amplification problem: every read returns 3× the bytes.
**Recommendation:** Store metadata once. Compute the other views server-side or via a separate index table.

## BLOCKER 4 — Missing regression test for the concurrency race (Standard 5, Test Coverage)

**File:** `app/api/projects/[id]/attach-items/route.test.ts`
**Locator:** the single `it("returns 200 and merged item count on the happy path", ...)` test is the only test in the file.
**Why:** Only the single-caller happy path is tested. The known failure mode for this surface is "two callers race the write → state lost" (per BLOCKER 1). A test that proves only the happy path provides no protection against the actual production failure mode.
**Fix:** Add a regression test that simulates two concurrent POSTs and asserts BOTH callers' items are present in the final state OR exactly one returns 409 with `code: "project_conflict"`.

## FLAG 5 — Owned-field `SET` not used (Standard 4, Architectural Alignment)

**File:** `app/api/projects/[id]/attach-items/route.ts`
**Locator:** same `PutCommand` block as BLOCKER 1, viewed from the architectural-conventions angle rather than the concurrency angle.
**Why:** `PutCommand` replaces the entire row, including fields this handler doesn't own (other writers' independently-managed fields are silently overwritten). The handler should write only the fields it owns: `items` and `updatedAt`.
**Recommendation:** Switch to `UpdateCommand` with `SET items = list_append(if_not_exists(items, :empty), :newItems), updatedAt = :now` — only the fields the handler owns.
