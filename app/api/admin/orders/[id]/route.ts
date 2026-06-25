import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const order = db
    .prepare(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone,
              dz.name as zone_name, r.name as rider_name, r.phone as rider_phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
       LEFT JOIN riders r ON r.id = o.rider_id
       WHERE o.id = ?`
    )
    .get(id);

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
  return NextResponse.json({ ...order as object, items });
}
