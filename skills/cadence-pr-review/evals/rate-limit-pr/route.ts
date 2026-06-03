// Fictional public upload-verify endpoint. Pretends to live at
// app/api/public/verify-upload/route.ts. Deliberately bad — exercises the
// cross-lens catches (Lens 1 silent-failure + Lens 2 security + Lens 3 test
// semantics) on a public unauthenticated endpoint. See
// ../expected-findings-rate-limit.md.
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const MAX_BYTES = 50 * 1024 * 1024

// Magic-byte signatures. Untested at unit level (see test file).
function sniffAudio(buf: Uint8Array): boolean {
  // MP3 (ID3 / frame sync) or WAV (RIFF....WAVE)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    return buf[8] === 0x57 && buf[9] === 0x41 && buf[10] === 0x56 && buf[11] === 0x45
  }
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "0.0.0.0"
  const ua = request.headers.get("user-agent") || ""

  // Identity hash includes UA → trivially rotated per request for a fresh bucket.
  const identity = `${ip}:${ua}`
  const rl = await checkRateLimit(identity)
  if (!rl.ok) {
    // Fail-closed (DDB outage) returns the SAME shape as a real burst — an
    // outage looks identical to ordinary throttling. No operational signal.
    return NextResponse.json({ ok: false, retryAfterSec: 1 }, { status: 429 })
  }

  // Body buffered into memory BEFORE any content-length check.
  const form = await request.formData()
  const file = form.get("file") as File
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 413 })
  }

  const mime = file.type
  if (!mime.startsWith("audio/")) {
    return NextResponse.json({ error: "not audio" }, { status: 415 })
  }
  if (!sniffAudio(bytes)) {
    return NextResponse.json({ error: "bad signature" }, { status: 415 })
  }

  return NextResponse.json({ ok: true })
}
