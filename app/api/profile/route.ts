import { NextRequest, NextResponse } from "next/server";
import { getSnapshot, updateProfile } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSnapshot().profile);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(updateProfile(body));
}
