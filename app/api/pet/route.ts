import { NextResponse } from "next/server";
import { getSnapshot } from "../../../lib/pet-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getSnapshot());
}
