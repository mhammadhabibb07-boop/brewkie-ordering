"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, ChefHat, Bike, Package, XCircle, Phone } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock size={20} />,
  confirmed: <CheckCircle size={20} />,
  preparing: <ChefHat size={20} />,
  out_for_delivery: <Bike size={20} />,
  delivered: <Package size={20} />,
  cancelled: <XCircle size={20} />,
};

function TrackContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const otp = params.get("otp");

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [lookupId, setLookupId] = useState(id ?? "");
  const [lookupOtp, setLookupOtp] = useState(otp ?? "");

  async function fetchOrder(ordId: string, ordOtp: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders?id=${ordId}&otp=${ordOtp}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id && otp) fetchOrder(id, otp);
  }, [id, otp]);

  // Auto-refresh every 30s for active orders
  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled") return;
    const interval = setInterval(() => fetchOrder(String(order.id), order.otp!), 30000);
    return () => clearInterval(interval);
  }, [order]);

  const currentStep = order ? STATUS_STEPS.indexOf(order.status as OrderStatus) : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg">Track Order</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Lookup form */}
        {!order && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800">Enter Order Details</h2>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Order ID</label>
              <input
                type="number"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="e.g. 42"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">OTP (from confirmation)</label>
              <input
                type="text"
                value={lookupOtp}
                onChange={(e) => setLookupOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={() => fetchOrder(lookupId, lookupOtp)}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
          </div>
        )}

        {order && (
          <>
            {/* Status card */}
            <div className={`rounded-2xl shadow-sm p-6 ${
              order.status === "delivered" ? "bg-green-500 text-white" :
              order.status === "cancelled" ? "bg-red-500 text-white" :
              "bg-orange-500 text-white"
            }`}>
              <p className="text-sm opacity-80 mb-1">Order #{order.id}</p>
              <div className="flex items-center gap-2 text-2xl font-bold mb-1">
                {STATUS_ICONS[order.status as OrderStatus]}
                {STATUS_LABELS[order.status as OrderStatus]}
              </div>
              {order.rider_name && order.status === "out_for_delivery" && (
                <p className="text-sm opacity-90 mt-2">
                  Rider: {order.rider_name} • {order.rider_phone && (
                    <a href={`tel:${order.rider_phone}`} className="underline">{order.rider_phone}</a>
                  )}
                </p>
              )}
            </div>

            {/* Progress tracker */}
            {order.status !== "cancelled" && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 -z-0" />
                  <div
                    className="absolute top-5 left-5 h-1 bg-orange-500 -z-0 transition-all duration-500"
                    style={{ width: currentStep > 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
                  />
                  {STATUS_STEPS.map((step, idx) => (
                    <div key={step} className="flex flex-col items-center gap-1 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        idx <= currentStep ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {STATUS_ICONS[step]}
                      </div>
                      <span className="text-xs text-center text-gray-600 w-14">
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order details */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Order Details</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Customer</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phone</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Address</span>
                  <span className="font-medium text-right max-w-[60%]">{order.address}</span>
                </div>
                {order.zone_name && (
                  <div className="flex justify-between text-gray-600">
                    <span>Area</span>
                    <span className="font-medium">{order.zone_name}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Payment</span>
                  <span className="font-medium capitalize">{order.payment_method.toUpperCase()}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name}
                      {item.variant_name && <span className="text-gray-400"> ({item.variant_name})</span>}
                      <span className="text-gray-400"> x{item.qty}</span>
                    </span>
                    <span className="font-medium">Rs. {item.total_price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>Rs. {order.delivery_fee}</span>
                </div>
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Total</span>
                  <span>Rs. {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1 text-center border-2 border-orange-500 text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-50">
                Order Again
              </Link>
              <a
                href={`https://wa.me/923000000000?text=Hi! I need help with order %23${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600"
              >
                <Phone size={16} /> WhatsApp Help
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}
