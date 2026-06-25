import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order").all();
  const products = db
    .prepare(
      `SELECT p.*, c.name as category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY c.sort_order, p.sort_order`
    )
    .all();
  const variants = db.prepare("SELECT * FROM product_variants ORDER BY id").all();
  return NextResponse.json({ categories, products, variants });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;
  const db = getDb();

  if (action === "toggle_product") {
    db.prepare("UPDATE products SET available = CASE WHEN available=1 THEN 0 ELSE 1 END WHERE id = ?").run(data.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "add_product") {
    const { name, description, price, category_id } = data;
    const r = db
      .prepare("INSERT INTO products (category_id, name, description, price) VALUES (?, ?, ?, ?)")
      .run(category_id, name, description ?? null, price);
    return NextResponse.json({ id: r.lastInsertRowid });
  }

  if (action === "update_price") {
    db.prepare("UPDATE products SET price = ? WHERE id = ?").run(data.price, data.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "add_category") {
    const r = db.prepare("INSERT INTO categories (name) VALUES (?)").run(data.name);
    return NextResponse.json({ id: r.lastInsertRowid });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
