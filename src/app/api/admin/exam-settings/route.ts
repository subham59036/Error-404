import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";
import { verifySession, getAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !(await verifySession(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDB();
    const db = getDB();

    const result = await db.execute({
      sql: `SELECT * FROM exam_settings ORDER BY level`,
      args: [],
    });

    return NextResponse.json({ settings: result.rows });
  } catch (error) {
    console.error("Get exam settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !(await verifySession(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDB();
    const db = getDB();
    const body = await request.json();
    const { level, isActive, timeLimit } = body;

    if (!level) {
      return NextResponse.json({ error: "Missing level" }, { status: 400 });
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO exam_settings (level, is_active, time_limit, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(level) DO UPDATE SET
              is_active = excluded.is_active,
              time_limit = excluded.time_limit,
              updated_at = excluded.updated_at`,
      args: [
        level,
        isActive !== undefined ? (isActive ? 1 : 0) : 0,
        timeLimit || 600,
        now,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update exam settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
