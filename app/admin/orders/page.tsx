"use client";
import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus, Rider } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";
import { RefreshCw, Phone, MapPin } from "lucide-react";

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    const [ordersRes, ridersRes] = await Promise.all([
      fetch(`/api/admin/orders${q}`).then((r) => r.json()),
      fetch("/api/riders").then((r) => r.json()),
    ]);
    setOrders(ordersRes.orders ?? []);
    setRiders(ridersRes.riders ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function updateOrder(id: number, updates: Partial<Order>) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchOrders();
  }

  const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
    pending: "confirmed",
    confirmed: "preparing",
    preparing: "out_for_delivery",
    out_for_delivery: "delivered",
    delivered: null,
    cancelled: null,
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s.value
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border hover:border-orange-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {orders.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No orders found</div>
        )}
        {orders.map((order) => {
          const nextStatus = NEXT_STATUS[order.status];
          const expanded = expandedId === order.id;

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expanded ? null : order.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.payment_status === "unpaid" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Unpaid
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-700 mt-0.5">{order.customer_name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                      <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 hover:text-orange-500">
                        <Phone size={12} /> {order.customer_phone}
                      </a>
                      {order.zone_name && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {order.zone_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-orange-600">Rs. {order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="border-t p-4 bg-gray-50 space-y-3">
                  <div className="text-sm text-gray-700">
                    <p><span className="font-medium">Address:</span> {order.address}</p>
                    {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
                    <p><span className="font-medium">Payment:</span> {order.payment_method?.toUpperCase()} — {order.payment_status}</p>
                    {order.rider_name && <p><span className="font-medium">Rider:</span> {order.rider_name}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => updateOrder(order.id, { status: nextStatus })}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600"
                      >
                        Mark as {STATUS_LABELS[nextStatus]}
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => updateOrder(order.id, { status: "cancelled" })}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    )}
                    {order.payment_status === "unpaid" && (
                      <button
                        onClick={() => updateOrder(order.id, { payment_status: "paid" })}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200"
                      >
                        Mark Paid
                      </button>
                    )}

                    {/* Assign rider */}
                    {riders.length > 0 && ["confirmed","preparing","out_for_delivery"].includes(order.status) && (
                      <select
                        defaultValue={order.rider_id ?? ""}
                        onChange={(e) => updateOrder(order.id, { rider_id: Number(e.target.value) || undefined })}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Assign rider...</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} — {r.phone}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
