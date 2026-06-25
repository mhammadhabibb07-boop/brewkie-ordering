import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const zones = db.prepare("SELECT * FROM delivery_zones ORDER BY name").all();
  return NextResponse.json({ zones });
}
