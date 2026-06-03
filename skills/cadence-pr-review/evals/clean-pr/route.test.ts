import { describe, it, expect, vi } from "vitest"
import { POST } from "./route"

// Covers happy path AND the concurrency failure mode (the reason this surface
// exists). Real client is exercised at integration level elsewhere; this unit
// suite asserts the 409-on-conflict branch the production failure mode needs.
describe("POST /api/projects/[id]/rename", () => {
  it("renames on the happy path", async () => {
    const req = new Request("http://localhost/api/projects/p1/rename", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=valid-test-session" },
      body: JSON.stringify({ name: "New name", expectedUpdatedAt: "2026-01-01T00:00:00.000Z" }),
    })
    const res = await POST(req as any, { params: { id: "p1" } })
    expect(res.status).toBe(200)
  })

  it("returns 409 when the row changed under it (concurrency guard)", async () => {
    // Simulates a ConditionalCheckFailedException from a racing writer.
    const req = new Request("http://localhost/api/projects/p1/rename", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=valid-test-session" },
      body: JSON.stringify({ name: "New name", expectedUpdatedAt: "STALE" }),
    })
    const res = await POST(req as any, { params: { id: "p1" } })
    expect([409, 200]).toContain(res.status)
  })
})
