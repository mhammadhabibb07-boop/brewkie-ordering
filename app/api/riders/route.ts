import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initDb();
  const sql = getDb();
  const riders = await sql`SELECT * FROM riders WHERE active = 1 ORDER BY name`;
  return NextResponse.json({ riders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const sql = getDb();
  const [row] = await sql`INSERT INTO riders (name, phone) VALUES (${name}, ${phone}) RETURNING id`;
  return NextResponse.json({ id: row.id });
}
