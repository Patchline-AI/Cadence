// Fictional admin-auth module. Pretends to live at lib/admin-auth.ts.
// Deliberately bad — exercises the Lens 2 (security) signature catches on an
// auth surface. See ../expected-findings-auth.md.
import { jwtVerify, createRemoteJWKSet } from "jose"

const JWKS = createRemoteJWKSet(new URL(process.env.COGNITO_JWKS_URL!))
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",")

// Single env var gates BOTH a routine step-up AND a destructive reset.
const ADMIN_ACTION_SECRET = process.env.ADMIN_ACTION_SECRET!

export async function verifyAdmin(token: string): Promise<{ email: string } | null> {
  // No `audience` / client_id option → a token minted for ANY App Client in the
  // same Cognito User Pool verifies here.
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.COGNITO_ISSUER,
  })

  // token_use checked only when present — absent claim passes silently.
  const tokenUse = payload["token_use"] as string | undefined
  if (tokenUse && tokenUse !== "access") return null

  // email_verified never checked; cognito:username used as an email fallback.
  // An attacker who registers with an admin's email as their *username* gets a
  // JWT whose cognito:username matches an admin while `email` is anything.
  const email = (payload.email as string) || (payload["cognito:username"] as string)
  if (!ADMIN_EMAILS.includes(email)) return null

  return { email }
}

export function authorizeAction(providedSecret: string): boolean {
  return providedSecret === ADMIN_ACTION_SECRET
}

export function setStepUpCookie(res: { cookie: Function }, userId?: string) {
  res.cookie("stepup", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24h step-up window — far too long
    // no `domain` pinned; no binding to userId (Cognito sub)
  })
}
