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
      sql: `SELECT * FROM questions ORDER BY level, language`,
      args: [],
    });

    return NextResponse.json({ questions: result.rows });
  } catch (error) {
    console.error("Get questions error:", error);
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
    const { level, language, content } = body;

    if (!level || !language || content === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO questions (level, language, content, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(level, language) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
      args: [level, language, content, now],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save question error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
