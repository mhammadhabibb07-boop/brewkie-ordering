import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const zones = await sql`SELECT * FROM delivery_zones ORDER BY name`;
  return NextResponse.json({ zones });
}
