import { describe, it, expect } from "vitest"
import { POST } from "./route"

describe("POST /api/projects/[id]/attach-items", () => {
  it("returns 200 and merged item count on the happy path", async () => {
    const request = new Request("http://localhost/api/projects/p1/attach-items", {
      method: "POST",
      headers: { "content-type": "application/json", "cookie": "session=valid-test-session" },
      body: JSON.stringify({ items: [{ id: "item-1", metadata: { foo: "bar" } }] }),
    })
    const response = await POST(request as any, { params: { id: "p1" } })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.count).toBe(1)
  })
})
