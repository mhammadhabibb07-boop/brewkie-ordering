import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initDb();
  const sql = getDb();
  const categories = await sql`SELECT * FROM categories ORDER BY sort_order`;
  const products = await sql`
    SELECT p.*, c.name as category_name
    FROM products p JOIN categories c ON c.id = p.category_id
    ORDER BY c.sort_order, p.sort_order
  `;
  const variants = await sql`SELECT * FROM product_variants ORDER BY id`;
  return NextResponse.json({ categories, products, variants });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;
  const sql = getDb();

  if (action === "toggle_product") {
    await sql`UPDATE products SET available = CASE WHEN available=1 THEN 0 ELSE 1 END WHERE id = ${data.id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === "add_product") {
    const { name, description, price, category_id, image_url } = data;
    const [row] = await sql`INSERT INTO products (category_id, name, description, price, image_url) VALUES (${category_id}, ${name}, ${description ?? null}, ${price}, ${image_url ?? null}) RETURNING id`;
    return NextResponse.json({ id: row.id });
  }

  if (action === "update_price") {
    await sql`UPDATE products SET price = ${data.price} WHERE id = ${data.id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === "add_category") {
    const [row] = await sql`INSERT INTO categories (name) VALUES (${data.name}) RETURNING id`;
    return NextResponse.json({ id: row.id });
  }

  if (action === "delete_product") {
    await sql`DELETE FROM order_items WHERE product_id = ${data.id}`;
    await sql`DELETE FROM product_variants WHERE product_id = ${data.id}`;
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_category") {
    const products = await sql`SELECT id FROM products WHERE category_id = ${data.id}`;
    for (const p of products) {
      await sql`DELETE FROM order_items WHERE product_id = ${p.id}`;
      await sql`DELETE FROM product_variants WHERE product_id = ${p.id}`;
    }
    await sql`DELETE FROM products WHERE category_id = ${data.id}`;
    await sql`DELETE FROM categories WHERE id = ${data.id}`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
