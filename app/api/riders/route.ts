import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const riders = db.prepare("SELECT * FROM riders WHERE active = 1 ORDER BY name").all();
  return NextResponse.json({ riders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = getDb();
  const r = db.prepare("INSERT INTO riders (name, phone) VALUES (?, ?)").run(name, phone);
  return NextResponse.json({ id: r.lastInsertRowid });
}
