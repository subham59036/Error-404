import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";
import { verifySession, getAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !(await verifySession(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDB();
    const db = getDB();
    const body = await request.json();
    const { teamId, fromLevel } = body;

    if (!teamId || !fromLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nextLevel = fromLevel + 1;
    if (nextLevel > 3) {
      return NextResponse.json({ error: "No next level available" }, { status: 400 });
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO level_progression (team_id, level, is_promoted, promoted_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(team_id, level) DO UPDATE SET is_promoted = 1, promoted_at = excluded.promoted_at`,
      args: [teamId, nextLevel, now],
    });

    return NextResponse.json({ success: true, nextLevel });
  } catch (error) {
    console.error("Promote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !(await verifySession(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDB();
    const db = getDB();
    const body = await request.json();
    const { teamId, fromLevel } = body;

    if (!teamId || !fromLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nextLevel = fromLevel + 1;

    await db.execute({
      sql: `UPDATE level_progression SET is_promoted = 0, promoted_at = NULL WHERE team_id = ? AND level = ?`,
      args: [teamId, nextLevel],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
