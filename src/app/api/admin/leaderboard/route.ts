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
    const level = parseInt(searchParams.get("level") || "1");

    // Get teams that are eligible for this level
    let teamIds: string[] = [];

    if (level === 1) {
      const teamsResult = await db.execute({
        sql: `SELECT id FROM teams`,
        args: [],
      });
      teamIds = teamsResult.rows.map((r) => r.id as string);
    } else {
      const progressionResult = await db.execute({
        sql: `SELECT team_id FROM level_progression WHERE level = ? AND is_promoted = 1`,
        args: [level],
      });
      teamIds = progressionResult.rows.map((r) => r.team_id as string);
    }

    if (teamIds.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Get submissions for this level
    const submissionsResult = await db.execute({
      sql: `SELECT * FROM submissions WHERE level = ?`,
      args: [level],
    });

    const submissionsMap: Record<string, typeof submissionsResult.rows[0]> = {};
    for (const sub of submissionsResult.rows) {
      submissionsMap[sub.team_id as string] = sub;
    }

    // Get team members
    const membersResult = await db.execute({
      sql: `SELECT * FROM team_members ORDER BY team_id, position`,
      args: [],
    });

    const membersMap: Record<string, typeof membersResult.rows> = {};
    for (const member of membersResult.rows) {
      const tid = member.team_id as string;
      if (!membersMap[tid]) membersMap[tid] = [];
      membersMap[tid].push(member);
    }

    // Get promotions for next level
    const nextLevel = level + 1;
    const promotionResult = await db.execute({
      sql: `SELECT team_id FROM level_progression WHERE level = ? AND is_promoted = 1`,
      args: [nextLevel],
    });
    const promotedTeams = new Set(promotionResult.rows.map((r) => r.team_id as string));

    // Build leaderboard entries
    const entries = teamIds.map((teamId) => {
      const submission = submissionsMap[teamId];
      const members = membersMap[teamId] || [];
      const memberCount = members.length;

      let marks = 0;
      let timeTaken: number | null = null;
      let status: "correct" | "incorrect" | "disqualified" | "pending" = "pending";

      if (submission) {
        if (submission.is_disqualified === 1) {
          status = "disqualified";
        } else if (submission.is_correct === 1) {
          status = "correct";
          marks = 1;
        } else {
          status = "incorrect";
        }
        timeTaken = submission.time_taken as number;
      }

      return {
        team_id: teamId,
        members,
        marks,
        time_taken: timeTaken,
        member_count: memberCount,
        is_promoted: promotedTeams.has(teamId),
        status,
      };
    });

    // Sort: marks DESC, time_taken ASC (null last), member_count ASC
    entries.sort((a, b) => {
      if (b.marks !== a.marks) return b.marks - a.marks;
      if (a.time_taken === null && b.time_taken === null) return 0;
      if (a.time_taken === null) return 1;
      if (b.time_taken === null) return -1;
      if (a.time_taken !== b.time_taken) return a.time_taken - b.time_taken;
      return a.member_count - b.member_count;
    });

    return NextResponse.json({ leaderboard: entries });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
