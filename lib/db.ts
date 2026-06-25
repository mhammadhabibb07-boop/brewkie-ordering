import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "brewkie.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      price_delta INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      name TEXT NOT NULL,
      variant_name TEXT,
      qty INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  const catCount = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
  if (catCount === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const cats = db.prepare("INSERT INTO categories (name, sort_order) VALUES (?, ?)");
  const prod = db.prepare(
    "INSERT INTO products (category_id, name, description, price, available, sort_order) VALUES (?, ?, ?, ?, 1, ?)"
  );
  const variant = db.prepare(
    "INSERT INTO product_variants (product_id, name, price_delta) VALUES (?, ?, ?)"
  );

  const juicesId = (cats.run("Juices", 1)).lastInsertRowid as number;
  const smoothieId = (cats.run("Smoothies", 2)).lastInsertRowid as number;
  const shakeId = (cats.run("Shakes", 3)).lastInsertRowid as number;
  const coldId = (cats.run("Cold Drinks", 4)).lastInsertRowid as number;

  const mango = prod.run(juicesId, "Mango Juice", "Fresh seasonal mango juice", 250, 1).lastInsertRowid as number;
  variant.run(mango, "Regular (350ml)", 0);
  variant.run(mango, "Large (500ml)", 50);

  const orange = prod.run(juicesId, "Orange Juice", "Fresh squeezed orange juice", 200, 2).lastInsertRowid as number;
  variant.run(orange, "Regular (350ml)", 0);
  variant.run(orange, "Large (500ml)", 50);

  const watermelon = prod.run(juicesId, "Watermelon Juice", "Cold pressed watermelon", 200, 3).lastInsertRowid as number;
  variant.run(watermelon, "Regular (350ml)", 0);
  variant.run(watermelon, "Large (500ml)", 50);

  const mango_smooth = prod.run(smoothieId, "Mango Smoothie", "Thick mango smoothie with milk", 350, 1).lastInsertRowid as number;
  variant.run(mango_smooth, "Regular", 0);
  variant.run(mango_smooth, "Large", 80);

  const berry = prod.run(smoothieId, "Mixed Berry Smoothie", "Strawberry, blueberry blend", 380, 2).lastInsertRowid as number;
  variant.run(berry, "Regular", 0);
  variant.run(berry, "Large", 80);

  const oreoShake = prod.run(shakeId, "Oreo Shake", "Creamy Oreo milkshake", 420, 1).lastInsertRowid as number;
  variant.run(oreoShake, "Regular", 0);
  variant.run(oreoShake, "Large", 100);

  const choc = prod.run(shakeId, "Chocolate Shake", "Rich chocolate milkshake", 400, 2).lastInsertRowid as number;
  variant.run(choc, "Regular", 0);
  variant.run(choc, "Large", 100);

  prod.run(coldId, "Lemonade", "Classic fresh lemonade", 150, 1);
  prod.run(coldId, "Mint Cooler", "Fresh mint with lemon & soda", 180, 2);

  // Delivery zones
  const zone = db.prepare("INSERT INTO delivery_zones (name, fee) VALUES (?, ?)");
  zone.run("DHA Phase 1-4", 100);
  zone.run("DHA Phase 5-6", 150);
  zone.run("Gulberg", 120);
  zone.run("Model Town", 130);
  zone.run("Johar Town", 140);

  // Default admin (password: admin123)
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run("admin", hash);

  // Settings
  const set = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  set.run("shop_name", "Brewkie");
  set.run("shop_phone", "+92-300-0000000");
  set.run("shop_address", "Lahore, Pakistan");
  set.run("min_order", "500");
  set.run("is_open", "true");
}
