import { NextRequest, NextResponse } from "next/server";
import { debugAdvance, getSiteConfig } from "../../../../lib/pet-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!getSiteConfig().debugEnabled) {
    return NextResponse.json({ error: "Debug mode is disabled." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  return NextResponse.json(debugAdvance(body));
}
