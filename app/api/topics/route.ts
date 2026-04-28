import { NextRequest, NextResponse } from "next/server";
import { getSnapshot, teachTopic } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSnapshot().topics);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { topic?: unknown; note?: unknown };

  try {
    return NextResponse.json(teachTopic(body.topic, body.note));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to teach topic." }, { status: 400 });
  }
}
