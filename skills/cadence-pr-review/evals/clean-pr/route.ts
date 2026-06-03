// Fictional clean endpoint. Pretends to live at
// app/api/projects/[id]/rename/route.ts. This fixture is CORRECT — it exists
// to calibrate AGAINST false positives. A correct cadence-pr-review run returns
// VERDICT: PASS (0 blockers, 0 flags). See ../expected-findings-clean.md.
import { NextRequest, NextResponse } from "next/server"
import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { getDocumentClient } from "@/lib/db/client"
import { getCurrentUser } from "@/lib/auth"
import { captureException } from "@/lib/observability"
import { ERROR_CODES } from "@/lib/constants/errors"
import { z } from "zod"

const PROJECTS_TABLE = process.env.PROJECTS_TABLE || "Projects-prod"
const RenameBody = z.object({ name: z.string().min(1).max(200), expectedUpdatedAt: z.string() })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const correlationId = crypto.randomUUID()
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const parsed = RenameBody.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: ERROR_CODES.INVALID_BODY, correlationId }, { status: 400 })
    }
    const { name, expectedUpdatedAt } = parsed.data

    const client = await getDocumentClient()
    if (!client) throw new Error("db unavailable")

    const now = new Date().toISOString()
    try {
      // Owned-field SET + optimistic-concurrency guard.
      await client.send(new UpdateCommand({
        TableName: PROJECTS_TABLE,
        Key: { id: params.id, userId: user.id },
        UpdateExpression: "SET #name = :name, updatedAt = :now",
        ConditionExpression: "attribute_not_exists(updatedAt) OR updatedAt = :expected",
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: { ":name": name, ":now": now, ":expected": expectedUpdatedAt },
      }))
    } catch (err: any) {
      if (err?.name === "ConditionalCheckFailedException") {
        return NextResponse.json(
          { error: ERROR_CODES.PROJECT_CONFLICT, correlationId },
          { status: 409 },
        )
      }
      throw err
    }

    return NextResponse.json({ ok: true, updatedAt: now })
  } catch (err) {
    captureException(err, { tags: { feature: "project.rename" }, correlationId })
    return NextResponse.json({ error: ERROR_CODES.INTERNAL, correlationId }, { status: 500 })
  }
}
