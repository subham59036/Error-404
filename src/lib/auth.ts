import { getDB, initDB } from "./db";
import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(deviceId: string): Promise<string | null> {
  const db = await initDB();

  // Check if any active session exists (single device constraint)
  const now = Date.now();
  const existing = await db.execute({
    sql: `SELECT id FROM superuser_sessions WHERE expires_at > ?`,
    args: [now],
  });

  if (existing.rows.length > 0) {
    return null; // Another device is already logged in
  }

  // Clean up expired sessions
  await db.execute({
    sql: `DELETE FROM superuser_sessions WHERE expires_at <= ?`,
    args: [now],
  });

  const token = generateToken();
  const expiresAt = now + 4 * 60 * 60 * 1000; // 4 hours

  await db.execute({
    sql: `INSERT INTO superuser_sessions (token, device_id, created_at, expires_at)
          VALUES (?, ?, ?, ?)`,
    args: [token, deviceId, now, expiresAt],
  });

  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  if (!token) return false;
  const db = getDB();
  const now = Date.now();

  const result = await db.execute({
    sql: `SELECT id FROM superuser_sessions WHERE token = ? AND expires_at > ?`,
    args: [token, now],
  });

  return result.rows.length > 0;
}

export async function deleteSession(token: string): Promise<void> {
  const db = getDB();
  await db.execute({
    sql: `DELETE FROM superuser_sessions WHERE token = ?`,
    args: [token],
  });
}

export async function forceDeleteAllSessions(): Promise<void> {
  const db = getDB();
  await db.execute({ sql: `DELETE FROM superuser_sessions`, args: [] });
}

export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
