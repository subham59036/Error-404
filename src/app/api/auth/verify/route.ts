import { NextRequest, NextResponse } from "next/server";
import { verifySession, getAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ valid: false });
    }
    const valid = await verifySession(token);
    return NextResponse.json({ valid });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ valid: false });
  }
}
