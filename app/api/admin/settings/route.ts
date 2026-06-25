import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM settings").all() as { key: string; value: string }[];
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await req.json() as Record<string, string>;
  const db = getDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(key, String(value));
  }
  return NextResponse.json({ ok: true });
}
