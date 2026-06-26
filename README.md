# Brewkie — Online Ordering & Delivery System

Full-stack ordering system for **Brewkie** (fresh juices, smoothies & shakes, Lahore, Pakistan).

## Features

- **Customer Menu** — Browse by category, pick variants (size), add to cart
- **Checkout** — Zone-based delivery fees, COD / JazzCash / Easypaisa
- **Order Tracking** — OTP-based tracking with live status updates
- **Admin Panel** — Dashboard, orders, menu, riders, shop settings
- **Zero-config database** — SQLite (better-sqlite3), auto-seeded on first run

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the customer menu.

## Admin Panel

Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- better-sqlite3 (embedded SQLite)
- Zustand (cart state, persisted to localStorage)
- bcryptjs (password hashing)
- Lucide React (icons)

## Project Structure

```
app/
  page.tsx                  # Customer menu
  checkout/page.tsx         # Checkout form
  track/page.tsx            # Order tracking
  admin/
    login/page.tsx          # Admin login (public)
    (protected)/            # Auth-gated admin pages
      page.tsx              # Dashboard
      orders/page.tsx       # Order management
      menu/page.tsx         # Menu management
      riders/page.tsx       # Rider management
      settings/page.tsx     # Shop settings
  api/                      # API routes
components/
  MenuPage.tsx              # Main customer UI
  admin/AdminNav.tsx        # Admin sidebar
lib/
  db.ts                     # SQLite setup & schema
  auth.ts                   # Session auth
  types.ts                  # Shared TypeScript types
store/
  cart.ts                   # Zustand cart store
```
