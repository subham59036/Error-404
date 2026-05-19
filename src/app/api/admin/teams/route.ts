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

    const teamsResult = await db.execute({
      sql: `SELECT * FROM teams ORDER BY created_at ASC`,
      args: [],
    });

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

    const teams = teamsResult.rows.map((team) => ({
      ...team,
      members: membersMap[team.id as string] || [],
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
