import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CartItem } from "@/lib/types";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, address, delivery_zone_id, payment_method, notes, items } = body as {
    name: string;
    phone: string;
    address: string;
    delivery_zone_id: number | null;
    payment_method: string;
    notes?: string;
    items: CartItem[];
  };

  if (!name || !phone || !address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sql = getDb();

  // Get or create customer
  let customerId: number;
  const existing = await sql`SELECT id FROM customers WHERE phone = ${phone}`;
  if (existing.length > 0) {
    customerId = existing[0].id;
  } else {
    const [row] = await sql`INSERT INTO customers (name, phone) VALUES (${name}, ${phone}) RETURNING id`;
    customerId = row.id;
  }

  // Get delivery fee
  let deliveryFee = 0;
  if (delivery_zone_id) {
    const zones = await sql`SELECT fee FROM delivery_zones WHERE id = ${delivery_zone_id}`;
    deliveryFee = zones[0]?.fee ?? 0;
  }

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const total = subtotal + deliveryFee;
  const otp = generateOtp();

  const [order] = await sql`
    INSERT INTO orders (customer_id, status, payment_method, subtotal, delivery_fee, total, address, delivery_zone_id, notes, otp)
    VALUES (${customerId}, 'pending', ${payment_method ?? "cod"}, ${subtotal}, ${deliveryFee}, ${total}, ${address}, ${delivery_zone_id ?? null}, ${notes ?? null}, ${otp})
    RETURNING id
  `;

  const orderId = order.id;

  for (const item of items) {
    await sql`
      INSERT INTO order_items (order_id, product_id, variant_id, name, variant_name, qty, unit_price, total_price)
      VALUES (${orderId}, ${item.product_id}, ${item.variant_id ?? null}, ${item.name}, ${item.variant_name ?? null}, ${item.qty}, ${item.unit_price}, ${item.unit_price * item.qty})
    `;
  }

  return NextResponse.json({ orderId, otp });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const otp = searchParams.get("otp");
  const id = searchParams.get("id");

  const sql = getDb();

  if (id && otp) {
    const rows = await sql`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             dz.name as zone_name, r.name as rider_name, r.phone as rider_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
      LEFT JOIN riders r ON r.id = o.rider_id
      WHERE o.id = ${id} AND o.otp = ${otp}
    `;
    if (!rows.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
    return NextResponse.json({ ...rows[0], items });
  }

  if (phone) {
    const customers = await sql`SELECT id FROM customers WHERE phone = ${phone}`;
    if (!customers.length) return NextResponse.json({ orders: [] });

    const orders = await sql`
      SELECT o.*, dz.name as zone_name
      FROM orders o
      LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
      WHERE o.customer_id = ${customers[0].id}
      ORDER BY o.created_at DESC
      LIMIT 20
    `;
    return NextResponse.json({ orders });
  }

  return NextResponse.json({ error: "Provide id+otp or phone" }, { status: 400 });
}
