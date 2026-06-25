import { cookies } from "next/headers";
import { getDb } from "./db";
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
  const db = getDb();
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as
    | { id: number; username: string; password_hash: string }
    | undefined;
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { adminId: admin.id, username: admin.username };
}
