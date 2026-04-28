import { NextRequest, NextResponse } from "next/server";
import { replyAsPet } from "../../../../lib/pet-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { message?: unknown; input?: unknown; text?: unknown };
  const message = body.message ?? body.input ?? body.text;
  return NextResponse.json(replyAsPet(message));
}
