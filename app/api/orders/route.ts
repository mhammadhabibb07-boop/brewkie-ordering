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

  const db = getDb();

  // Get or create customer
  let customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone) as
    | { id: number }
    | undefined;
  if (!customer) {
    const r = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(name, phone);
    customer = { id: r.lastInsertRowid as number };
  }

  // Get delivery fee
  let deliveryFee = 0;
  if (delivery_zone_id) {
    const zone = db.prepare("SELECT fee FROM delivery_zones WHERE id = ?").get(delivery_zone_id) as
      | { fee: number }
      | undefined;
    deliveryFee = zone?.fee ?? 0;
  }

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const total = subtotal + deliveryFee;
  const otp = generateOtp();

  const order = db
    .prepare(
      `INSERT INTO orders (customer_id, status, payment_method, subtotal, delivery_fee, total, address, delivery_zone_id, notes, otp)
       VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      customer.id,
      payment_method ?? "cod",
      subtotal,
      deliveryFee,
      total,
      address,
      delivery_zone_id ?? null,
      notes ?? null,
      otp
    );

  const orderId = order.lastInsertRowid as number;

  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, variant_id, name, variant_name, qty, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const item of items) {
    insertItem.run(
      orderId,
      item.product_id,
      item.variant_id ?? null,
      item.name,
      item.variant_name ?? null,
      item.qty,
      item.unit_price,
      item.unit_price * item.qty
    );
  }

  return NextResponse.json({ orderId, otp });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const otp = searchParams.get("otp");
  const id = searchParams.get("id");

  const db = getDb();

  if (id && otp) {
    const order = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             dz.name as zone_name, r.name as rider_name, r.phone as rider_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
      LEFT JOIN riders r ON r.id = o.rider_id
      WHERE o.id = ? AND o.otp = ?
    `).get(id, otp) as Record<string, unknown> | undefined;

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
    return NextResponse.json({ ...order, items });
  }

  if (phone) {
    const customer = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone) as
      | { id: number }
      | undefined;
    if (!customer) return NextResponse.json({ orders: [] });

    const orders = db.prepare(`
      SELECT o.*, dz.name as zone_name
      FROM orders o
      LEFT JOIN delivery_zones dz ON dz.id = o.delivery_zone_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 20
    `).all(customer.id);

    return NextResponse.json({ orders });
  }

  return NextResponse.json({ error: "Provide id+otp or phone" }, { status: 400 });
}
