import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  await initDb();
  const sql = getDb();

  const products = await sql`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.available = 1
    ORDER BY c.sort_order, p.sort_order
  `;

  const variants = await sql`SELECT * FROM product_variants`;
  const categories = await sql`SELECT * FROM categories ORDER BY sort_order`;

  const variantMap = new Map<number, typeof variants>();
  for (const v of variants) {
    if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
    variantMap.get(v.product_id)!.push(v);
  }

  const result = products.map((p) => ({ ...p, variants: variantMap.get(p.id) ?? [] }));
  return NextResponse.json({ products: result, categories });
}
