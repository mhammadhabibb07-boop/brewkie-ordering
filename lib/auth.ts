import { cookies } from "next/headers";
import { getDb, initDb } from "./db";
import bcrypt from "bcryptjs";

export type Session = { adminId: number; username: string };

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("brewkie_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

export function createSessionCookie(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export async function verifyAdmin(username: string, password: string): Promise<Session | null> {
  await initDb();
  const sql = getDb();
  const rows = await sql`SELECT * FROM admins WHERE username = ${username}`;
  const admin = rows[0] as { id: number; username: string; password_hash: string } | undefined;
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { adminId: admin.id, username: admin.username };
}
