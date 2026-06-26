import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export function getDb() {
  return sql;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Sql = any;

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      price_delta INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS riders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT 'cod',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      address TEXT NOT NULL,
      delivery_zone_id INTEGER REFERENCES delivery_zones(id),
      rider_id INTEGER REFERENCES riders(id),
      notes TEXT,
      otp TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      name TEXT NOT NULL,
      variant_name TEXT,
      qty INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  // Seed if empty
  const cats = await sql`SELECT COUNT(*) as c FROM categories`;
  if (Number(cats[0].c) === 0) {
    await seedData(sql);
  }
}

async function seedData(sql: Sql) {
  const [juices] = await sql`INSERT INTO categories (name, sort_order) VALUES ('Juices', 1) RETURNING id`;
  const [smoothies] = await sql`INSERT INTO categories (name, sort_order) VALUES ('Smoothies', 2) RETURNING id`;
  const [shakes] = await sql`INSERT INTO categories (name, sort_order) VALUES ('Shakes', 3) RETURNING id`;
  const [cold] = await sql`INSERT INTO categories (name, sort_order) VALUES ('Cold Drinks', 4) RETURNING id`;

  const [mango] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${juices.id}, 'Mango Juice', 'Fresh seasonal mango juice', 250, 1, 1) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${mango.id}, 'Regular (350ml)', 0), (${mango.id}, 'Large (500ml)', 50)`;

  const [orange] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${juices.id}, 'Orange Juice', 'Fresh squeezed orange juice', 200, 1, 2) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${orange.id}, 'Regular (350ml)', 0), (${orange.id}, 'Large (500ml)', 50)`;

  const [watermelon] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${juices.id}, 'Watermelon Juice', 'Cold pressed watermelon', 200, 1, 3) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${watermelon.id}, 'Regular (350ml)', 0), (${watermelon.id}, 'Large (500ml)', 50)`;

  const [mangoSmooth] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${smoothies.id}, 'Mango Smoothie', 'Thick mango smoothie with milk', 350, 1, 1) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${mangoSmooth.id}, 'Regular', 0), (${mangoSmooth.id}, 'Large', 80)`;

  const [berry] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${smoothies.id}, 'Mixed Berry Smoothie', 'Strawberry, blueberry blend', 380, 1, 2) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${berry.id}, 'Regular', 0), (${berry.id}, 'Large', 80)`;

  const [oreo] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${shakes.id}, 'Oreo Shake', 'Creamy Oreo milkshake', 420, 1, 1) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${oreo.id}, 'Regular', 0), (${oreo.id}, 'Large', 100)`;

  const [choc] = await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${shakes.id}, 'Chocolate Shake', 'Rich chocolate milkshake', 400, 1, 2) RETURNING id`;
  await sql`INSERT INTO product_variants (product_id, name, price_delta) VALUES (${choc.id}, 'Regular', 0), (${choc.id}, 'Large', 100)`;

  await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${cold.id}, 'Lemonade', 'Classic fresh lemonade', 150, 1, 1)`;
  await sql`INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (${cold.id}, 'Mint Cooler', 'Fresh mint with lemon & soda', 180, 1, 2)`;

  await sql`INSERT INTO delivery_zones (name, fee) VALUES ('DHA Phase 1-4', 100), ('DHA Phase 5-6', 150), ('Gulberg', 120), ('Model Town', 130), ('Johar Town', 140)`;

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("admin123", 10);
  await sql`INSERT INTO admins (username, password_hash) VALUES ('admin', ${hash})`;

  await sql`
    INSERT INTO settings (key, value) VALUES
    ('shop_name', 'Brewkie'),
    ('shop_phone', '+92-300-0000000'),
    ('shop_address', 'Lahore, Pakistan'),
    ('min_order', '500'),
    ('is_open', 'true')
  `;
}
