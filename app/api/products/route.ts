import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Product, ProductVariant } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.available = 1
    ORDER BY c.sort_order, p.sort_order
  `).all() as Product[];

  const variants = db.prepare("SELECT * FROM product_variants").all() as ProductVariant[];

  const variantMap = new Map<number, ProductVariant[]>();
  for (const v of variants) {
    if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
    variantMap.get(v.product_id)!.push(v);
  }

  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order").all();

  const result = products.map((p) => ({ ...p, variants: variantMap.get(p.id) ?? [] }));

  return NextResponse.json({ products: result, categories });
}
