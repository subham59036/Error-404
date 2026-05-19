import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { initDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    const { password, deviceId } = body;

    if (!password || password !== process.env.SUPERUSER_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await createSession(deviceId || "unknown");

    if (!token) {
      return NextResponse.json(
        { error: "Another device is already logged in. Please try again later." },
        { status: 409 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
