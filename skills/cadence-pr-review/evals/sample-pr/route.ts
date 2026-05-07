import { NextRequest, NextResponse } from "next/server"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { getDocumentClient } from "@/lib/db/client"
import { getCurrentUser } from "@/lib/auth"

const PROJECTS_TABLE = process.env.PROJECTS_TABLE || "Projects-prod"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await request.json()
    const { items } = body as { items: Array<{ id: string; metadata: Record<string, unknown> }> }

    const client = await getDocumentClient()
    if (!client) throw new Error("db unavailable")

    const project = await client.send(/* GetCommand omitted for brevity */ {} as any)
    const existing = (project as any).Item || { items: [], updatedAt: new Date().toISOString() }

    const merged = [...existing.items]
    for (const item of items) {
      const enrichedItem = {
        id: item.id,
        metadata: item.metadata,
        analysisData: item.metadata,
        searchIndex: item.metadata,
      }
      merged.push(enrichedItem)
    }

    await client.send(new PutCommand({
      TableName: PROJECTS_TABLE,
      Item: {
        ...existing,
        items: merged,
        updatedAt: new Date().toISOString(),
      },
    }))

    return NextResponse.json({ ok: true, count: merged.length })
  } catch (err) {
    console.error("attach-items failed:", err)
    return NextResponse.json({ error: "Failed to attach items" }, { status: 500 })
  }
}
