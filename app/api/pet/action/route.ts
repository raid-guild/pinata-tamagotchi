import { NextRequest, NextResponse } from "next/server";
import { applyCareAction, isCareAction } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { action?: unknown };

  if (!isCareAction(body.action)) {
    return NextResponse.json({ error: "Expected action to be feed, play, clean, or study." }, { status: 400 });
  }

  return NextResponse.json(applyCareAction(body.action));
}
