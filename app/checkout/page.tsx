"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, User, Bike, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import type { DeliveryZone } from "@/lib/types";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    delivery_zone_id: "" as string | number,
    payment_method: "cod",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/zones").then((r) => r.json()).then((d) => setZones(d.zones ?? []));
  }, []);

  const selectedZone = zones.find((z) => z.id === Number(form.delivery_zone_id));
  const deliveryFee = selectedZone?.fee ?? 0;
  const subtotal = cart.total();
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (cart.items.length === 0) { setError("Your cart is empty"); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          delivery_zone_id: form.delivery_zone_id ? Number(form.delivery_zone_id) : null,
          payment_method: form.payment_method,
          notes: form.notes,
          items: cart.items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      cart.clear();
      router.push(`/track?id=${data.orderId}&otp=${data.otp}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <Link href="/" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={`${item.product_id}-${item.variant_id}`} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name}
                  {item.variant_name && <span className="text-gray-400"> ({item.variant_name})</span>}
                  <span className="text-gray-400"> x{item.qty}</span>
                </span>
                <span className="font-medium">Rs. {(item.unit_price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery fee</span>
                <span>{deliveryFee > 0 ? `Rs. ${deliveryFee}` : "—"}</span>
              </div>
              <div className="flex justify-between font-bold text-orange-600 text-lg border-t pt-2">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <h2 className="font-bold text-gray-800">Delivery Details</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <User size={14} /> Full Name *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ahmed Khan"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone size={14} /> Phone Number *
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="03XX-XXXXXXX"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Delivery Area
              </label>
              <select
                value={form.delivery_zone_id}
                onChange={(e) => setForm((f) => ({ ...f, delivery_zone_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Select area...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — Rs. {z.fee} delivery fee
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Full Address *
              </label>
              <textarea
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="House #, Street, Block..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <CreditCard size={14} /> Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "cod", label: "Cash on Delivery" },
                  { value: "jazzcash", label: "JazzCash" },
                  { value: "easypaisa", label: "Easypaisa" },
                ].map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, payment_method: pm.value }))}
                    className={`p-2 border-2 rounded-xl text-xs font-medium transition-all ${
                      form.payment_method === pm.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-orange-300"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
              {form.payment_method !== "cod" && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Bike size={12} /> Send payment to 0300-0000000 then place order.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText size={14} /> Special Instructions (optional)
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="No sugar, extra cold..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {loading ? "Placing Order..." : `Place Order — Rs. ${total.toLocaleString()}`}
          </button>
        </form>
      </main>
    </div>
  );
}
