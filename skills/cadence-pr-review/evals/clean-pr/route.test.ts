import { describe, it, expect, vi, beforeEach } from "vitest"

// Unit test for a single API route. Per test-coverage.md the "no mocks for
// data" rule targets INTEGRATION/SYSTEM tests; a colocated route unit test
// legitimately stubs its dependency boundary to exercise a specific branch.
// Here we force the concurrency-conflict branch deterministically so the
// failure-mode test can actually catch a guard regression (asserts === 409,
// never a loose [409, 200]).
const send = vi.fn()
vi.mock("@/lib/db/client", () => ({ getDocumentClient: vi.fn(async () => ({ send })) }))
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => ({ id: "user-1" })) }))
vi.mock("@/lib/observability", () => ({ captureException: vi.fn() }))
vi.mock("@/lib/constants/errors", () => ({
  ERROR_CODES: { INVALID_BODY: "invalid_body", PROJECT_CONFLICT: "project_conflict", INTERNAL: "internal" },
}))

import { POST } from "./route"

function req(body: unknown) {
  return new Request("http://localhost/api/projects/p1/rename", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "session=valid-test-session" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/projects/[id]/rename", () => {
  beforeEach(() => send.mockReset())

  it("renames on the happy path", async () => {
    send.mockResolvedValueOnce({})
    const res = await POST(req({ name: "New name", expectedUpdatedAt: "2026-01-01T00:00:00.000Z" }) as any, {
      params: { id: "p1" },
    })
    expect(res.status).toBe(200)
  })

  it("returns 409 when a racing writer changed the row (concurrency guard fires)", async () => {
    send.mockRejectedValueOnce(
      Object.assign(new Error("conflict"), { name: "ConditionalCheckFailedException" }),
    )
    const res = await POST(req({ name: "New name", expectedUpdatedAt: "STALE" }) as any, {
      params: { id: "p1" },
    })
    expect(res.status).toBe(409)
  })
})
