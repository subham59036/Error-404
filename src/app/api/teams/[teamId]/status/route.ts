import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    await initDB();
    const db = getDB();
    const { teamId } = await params;

    const teamResult = await db.execute({
      sql: `SELECT * FROM teams WHERE id = ?`,
      args: [teamId],
    });

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teamResult.rows[0];

    const membersResult = await db.execute({
      sql: `SELECT * FROM team_members WHERE team_id = ? ORDER BY position`,
      args: [teamId],
    });

    const members = membersResult.rows;

    const examSettingsResult = await db.execute({
      sql: `SELECT * FROM exam_settings ORDER BY level`,
      args: [],
    });

    const settingsMap: Record<number, { is_active: number; time_limit: number }> = {};
    for (const row of examSettingsResult.rows) {
      settingsMap[row.level as number] = {
        is_active: row.is_active as number,
        time_limit: row.time_limit as number,
      };
    }

    const submissionsResult = await db.execute({
      sql: `SELECT * FROM submissions WHERE team_id = ?`,
      args: [teamId],
    });

    const submissionsMap: Record<number, typeof submissionsResult.rows[0]> = {};
    for (const row of submissionsResult.rows) {
      submissionsMap[row.level as number] = row;
    }

    const progressionResult = await db.execute({
      sql: `SELECT * FROM level_progression WHERE team_id = ?`,
      args: [teamId],
    });

    const progressionMap: Record<number, { is_promoted: number }> = {};
    for (const row of progressionResult.rows) {
      progressionMap[row.level as number] = { is_promoted: row.is_promoted as number };
    }

    const buildLevelStatus = (level: number) => {
      const settings = settingsMap[level] || { is_active: 0, time_limit: 600 };
      const submission = submissionsMap[level] || null;
      const progression = progressionMap[level];

      let isQualified = false;
      if (level === 1 || level === 2) {
        isQualified = true;
      } else {
        isQualified = !!(progression?.is_promoted);
      }

      return {
        isActive: settings.is_active === 1,
        timeLimit: settings.time_limit,
        isQualified,
        hasSubmitted: !!submission,
        isDisqualified: submission ? submission.is_disqualified === 1 : false,
        isPromoted: !!(progression?.is_promoted),
        submission: submission
          ? {
              id: submission.id,
              team_id: submission.team_id,
              level: submission.level,
              language: submission.language,
              code: submission.code,
              is_correct: submission.is_correct,
              gemini_response: submission.gemini_response,
              time_taken: submission.time_taken,
              submitted_at: submission.submitted_at,
              is_disqualified: submission.is_disqualified,
            }
          : null,
      };
    };

    return NextResponse.json({
      team: { id: team.id, created_at: team.created_at },
      members,
      levels: {
        1: buildLevelStatus(1),
        2: buildLevelStatus(2),
        3: buildLevelStatus(3),
      },
    });
  } catch (error) {
    console.error("Team status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
