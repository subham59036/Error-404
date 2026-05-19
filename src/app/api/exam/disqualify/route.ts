import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDB();
    const db = getDB();
    const body = await request.json();
    const { teamId, level, timeTaken } = body;

    if (!teamId || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if already submitted
    const existingResult = await db.execute({
      sql: `SELECT id, is_disqualified FROM submissions WHERE team_id = ? AND level = ?`,
      args: [teamId, level],
    });

    if (existingResult.rows.length > 0) {
      // Already has a submission - don't override
      return NextResponse.json({ success: true, already_submitted: true });
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO submissions (team_id, level, language, code, is_correct, gemini_response, time_taken, submitted_at, is_disqualified)
            VALUES (?, ?, 'none', '', 0, 'DISQUALIFIED\nStudent switched tabs, minimised browser, or attempted to cheat.', ?, ?, 1)`,
      args: [teamId, level, timeTaken || 0, now],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disqualify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
