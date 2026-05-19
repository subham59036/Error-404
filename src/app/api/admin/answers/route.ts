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

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");

    let sql = `SELECT * FROM submissions ORDER BY submitted_at DESC`;
    const args: (string | number)[] = [];

    if (level) {
      sql = `SELECT * FROM submissions WHERE level = ? ORDER BY submitted_at DESC`;
      args.push(parseInt(level));
    }

    const result = await db.execute({ sql, args });

    return NextResponse.json({ answers: result.rows });
  } catch (error) {
    console.error("Get answers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
