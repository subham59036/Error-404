import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";
import { generateTeamId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    await initDB();
    const db = getDB();
    const body = await request.json();
    const { members } = body;

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ error: "Invalid members data" }, { status: 400 });
    }

    if (members.length < 3 || members.length > 4) {
      return NextResponse.json(
        { error: "Team must have 3 or 4 members" },
        { status: 400 }
      );
    }

    for (const member of members) {
      if (!member.name?.trim() || !member.email?.trim() || !member.department?.trim()) {
        return NextResponse.json(
          { error: "All member fields (name, email, department) are required" },
          { status: 400 }
        );
      }
    }

    // Generate unique team ID
    let teamId = generateTeamId();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.execute({
        sql: `SELECT id FROM teams WHERE id = ?`,
        args: [teamId],
      });
      if (existing.rows.length === 0) break;
      teamId = generateTeamId();
      attempts++;
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO teams (id, created_at) VALUES (?, ?)`,
      args: [teamId, now],
    });

    for (let i = 0; i < members.length; i++) {
      await db.execute({
        sql: `INSERT INTO team_members (team_id, name, email, department, position)
              VALUES (?, ?, ?, ?, ?)`,
        args: [teamId, members[i].name.trim(), members[i].email.trim(), members[i].department, i + 1],
      });
    }

    return NextResponse.json({ teamId });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
