import { getDb, initDb } from "@/lib/db";
import { ShoppingBag, Users, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await initDb();
  const sql = getDb();

  const [{ c: totalOrders }] = await sql`SELECT COUNT(*) as c FROM orders` as { c: number }[];
  const [{ c: todayOrders }] = await sql`SELECT COUNT(*) as c FROM orders WHERE created_at::date = CURRENT_DATE` as { c: number }[];
  const [{ r: revenue }] = await sql`SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'cancelled'` as { r: number }[];
  const [{ c: totalCustomers }] = await sql`SELECT COUNT(*) as c FROM customers` as { c: number }[];

  const pendingOrders = await sql`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.status IN ('pending','confirmed','preparing','out_for_delivery')
    ORDER BY o.created_at DESC
    LIMIT 10
  ` as Order[];

  const stats = [
    { label: "Today's Orders", value: todayOrders, icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Total Orders", value: totalOrders, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Revenue", value: `Rs. ${Number(revenue).toLocaleString()}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">Active Orders</h2>
          <Link href="/admin/orders" className="text-sm text-orange-600 hover:underline">View all</Link>
        </div>
        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No active orders right now</div>
        ) : (
          <div className="divide-y">
            {pendingOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-800">
                    Order #{order.id} — {order.customer_name}
                  </p>
                  <p className="text-sm text-gray-500">{order.customer_phone} • Rs. {order.total.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <Link
                    href={`/admin/orders?highlight=${order.id}`}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
