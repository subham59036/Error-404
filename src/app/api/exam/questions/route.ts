import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDB();
    const db = getDB();

    const { searchParams } = new URL(request.url);
    const level = parseInt(searchParams.get("level") || "1");

    const result = await db.execute({
      sql: `SELECT level, language, content FROM questions WHERE level = ?`,
      args: [level],
    });

    return NextResponse.json({ questions: result.rows });
  } catch (error) {
    console.error("Get public questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
