import { describe, it, expect } from "vitest"
import { POST } from "./route"

// Inadequate: the only "rejection" test sends text/plain, which fails the MIME
// check FIRST and never reaches the magic-byte branch. The sniffAudio() logic
// is therefore untested — a future refactor of the byte comparison regresses
// silently past CI.
describe("POST /api/public/verify-upload", () => {
  it("rejects non-audio", async () => {
    const form = new FormData()
    form.set("file", new File(["hello"], "x.txt", { type: "text/plain" }))
    const req = new Request("http://localhost/api/public/verify-upload", {
      method: "POST",
      body: form,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(415)
  })
})
