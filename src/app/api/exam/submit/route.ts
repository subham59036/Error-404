import { NextRequest, NextResponse } from "next/server";
import { initDB, getDB } from "@/lib/db";
import { evaluateLevel1or2, evaluateLevel3 } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    await initDB();
    const db = getDB();
    const body = await request.json();
    const { teamId, level, language, code, timeTaken } = body;

    if (!teamId || !level || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if team already submitted for this level
    const existingResult = await db.execute({
      sql: `SELECT id FROM submissions WHERE team_id = ? AND level = ?`,
      args: [teamId, level],
    });

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Already submitted for this level" },
        { status: 409 }
      );
    }

    // Check if exam is active
    const settingsResult = await db.execute({
      sql: `SELECT is_active FROM exam_settings WHERE level = ?`,
      args: [level],
    });

    const settings = settingsResult.rows[0];
    if (!settings || settings.is_active === 0) {
      return NextResponse.json({ error: "Exam is not active" }, { status: 403 });
    }

    // Evaluate the code with Gemini
    let evaluationResult;

    if (level === 1 || level === 2) {
      const questionResult = await db.execute({
        sql: `SELECT content FROM questions WHERE level = ? AND language = ?`,
        args: [level, language],
      });
      const question = questionResult.rows[0];
      const originalCode = question ? (question.content as string) : "";

      evaluationResult = await evaluateLevel1or2(language, originalCode, code || "");
    } else {
      const questionResult = await db.execute({
        sql: `SELECT content FROM questions WHERE level = ? AND language = 'general'`,
        args: [level],
      });
      const question = questionResult.rows[0];
      const problemStatement = question ? (question.content as string) : "";

      evaluationResult = await evaluateLevel3(level, language, problemStatement, code || "");
    }

    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO submissions (team_id, level, language, code, is_correct, gemini_response, time_taken, submitted_at, is_disqualified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        teamId,
        level,
        language,
        code || "",
        evaluationResult.is_correct ? 1 : 0,
        evaluationResult.response,
        timeTaken || 0,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      is_correct: evaluationResult.is_correct,
      gemini_response: evaluationResult.response,
      time_taken: timeTaken || 0,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
