import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const db = getDb();
  const where = status ? "WHERE o.status = ?" : "";
  const args = status ? [status] : [];

  const orders = db
    .prepare(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone,
              dz.name as zone_name, r.name as rider_name
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
       LEFT JOIN riders r ON r.id = o.rider_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT 200`
    )
    .all(...args);

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, rider_id, payment_status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: unknown[] = [];

  if (status) { sets.push("status = ?"); args.push(status); }
  if (rider_id !== undefined) { sets.push("rider_id = ?"); args.push(rider_id); }
  if (payment_status) { sets.push("payment_status = ?"); args.push(payment_status); }

  args.push(id);
  db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...args);

  return NextResponse.json({ ok: true });
}
