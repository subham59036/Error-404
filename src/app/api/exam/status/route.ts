import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDB();
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const level = parseInt(searchParams.get("level") || "1");

    if (!teamId) {
      return NextResponse.json({ error: "teamId required" }, { status: 400 });
    }

    const settingsResult = await db.execute({
      sql: `SELECT * FROM exam_settings WHERE level = ?`,
      args: [level],
    });

    const settings = settingsResult.rows[0];

    const submissionResult = await db.execute({
      sql: `SELECT * FROM submissions WHERE team_id = ? AND level = ?`,
      args: [teamId, level],
    });

    const submission = submissionResult.rows[0] || null;

    let isQualified = false;
    if (level === 1) {
      const teamResult = await db.execute({
        sql: `SELECT id FROM teams WHERE id = ?`,
        args: [teamId],
      });
      isQualified = teamResult.rows.length > 0;
    } else {
      const progressionResult = await db.execute({
        sql: `SELECT is_promoted FROM level_progression WHERE team_id = ? AND level = ?`,
        args: [teamId, level],
      });
      isQualified = progressionResult.rows.length > 0 &&
        progressionResult.rows[0].is_promoted === 1;
    }

    return NextResponse.json({
      isActive: settings ? settings.is_active === 1 : false,
      timeLimit: settings ? settings.time_limit : 600,
      isQualified,
      hasSubmitted: !!submission,
      isDisqualified: submission ? submission.is_disqualified === 1 : false,
    });
  } catch (error) {
    console.error("Exam status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
