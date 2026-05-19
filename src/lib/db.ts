import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDB(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDB(): Promise<Client> {
  const db = getDB();

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS superuser_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT NOT NULL REFERENCES teams(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT NOT NULL,
        position INTEGER NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL,
        UNIQUE(level, language)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT NOT NULL REFERENCES teams(id),
        level INTEGER NOT NULL,
        language TEXT NOT NULL,
        code TEXT NOT NULL DEFAULT '',
        is_correct INTEGER NOT NULL DEFAULT 0,
        gemini_response TEXT NOT NULL DEFAULT '',
        time_taken INTEGER NOT NULL DEFAULT 0,
        submitted_at INTEGER NOT NULL,
        is_disqualified INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS exam_settings (
        level INTEGER PRIMARY KEY,
        is_active INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 600,
        updated_at INTEGER NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS level_progression (
        team_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        is_promoted INTEGER NOT NULL DEFAULT 0,
        promoted_at INTEGER,
        PRIMARY KEY (team_id, level)
      )`,
      args: [],
    },
  ]);

  // Seed default exam settings for all 3 levels
  const now = Date.now();
  for (const level of [1, 2, 3]) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO exam_settings (level, is_active, time_limit, updated_at)
            VALUES (?, 0, 600, ?)`,
      args: [level, now],
    });
  }

  // Seed default questions for all levels and languages
  const questionSeeds = [
    { level: 1, language: "c" },
    { level: 1, language: "javascript" },
    { level: 1, language: "python" },
    { level: 1, language: "java" },
    { level: 2, language: "general" },
    { level: 3, language: "general" },
  ];

  for (const q of questionSeeds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO questions (level, language, content, updated_at)
            VALUES (?, ?, '', ?)`,
      args: [q.level, q.language, now],
    });
  }

  return db;
}
