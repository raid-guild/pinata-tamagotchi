import { NextResponse } from "next/server";
import { resetPet } from "../../../../lib/pet-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST() {
  return NextResponse.json(resetPet());
}
