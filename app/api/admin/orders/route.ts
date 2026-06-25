import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  await initDb();
  const sql = getDb();
  const orders = status
    ? await sql`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
               dz.name as zone_name, r.name as rider_name
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
        LEFT JOIN riders r ON r.id = o.rider_id
        WHERE o.status = ${status}
        ORDER BY o.created_at DESC LIMIT 200`
    : await sql`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
               dz.name as zone_name, r.name as rider_name
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
        LEFT JOIN riders r ON r.id = o.rider_id
        ORDER BY o.created_at DESC LIMIT 200`;

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, rider_id, payment_status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const sql = getDb();

  if (status && rider_id !== undefined && payment_status) {
    await sql`UPDATE orders SET status=${status}, rider_id=${rider_id}, payment_status=${payment_status}, updated_at=now() WHERE id=${id}`;
  } else if (status && rider_id !== undefined) {
    await sql`UPDATE orders SET status=${status}, rider_id=${rider_id}, updated_at=now() WHERE id=${id}`;
  } else if (status && payment_status) {
    await sql`UPDATE orders SET status=${status}, payment_status=${payment_status}, updated_at=now() WHERE id=${id}`;
  } else if (rider_id !== undefined && payment_status) {
    await sql`UPDATE orders SET rider_id=${rider_id}, payment_status=${payment_status}, updated_at=now() WHERE id=${id}`;
  } else if (status) {
    await sql`UPDATE orders SET status=${status}, updated_at=now() WHERE id=${id}`;
  } else if (rider_id !== undefined) {
    await sql`UPDATE orders SET rider_id=${rider_id}, updated_at=now() WHERE id=${id}`;
  } else if (payment_status) {
    await sql`UPDATE orders SET payment_status=${payment_status}, updated_at=now() WHERE id=${id}`;
  }

  return NextResponse.json({ ok: true });
}
