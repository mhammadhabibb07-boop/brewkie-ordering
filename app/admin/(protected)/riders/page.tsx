"use client";
import { useState, useEffect } from "react";
import { Plus, Phone } from "lucide-react";
import type { Rider } from "@/lib/types";

export default function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");

  async function fetchRiders() {
    const res = await fetch("/api/riders");
    const d = await res.json();
    setRiders(d.riders ?? []);
  }

  useEffect(() => { fetchRiders(); }, []);

  async function addRider() {
    setError("");
    if (!form.name || !form.phone) { setError("All fields required"); return; }
    const res = await fetch("/api/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError("Failed to add rider"); return; }
    setForm({ name: "", phone: "" });
    setShowAdd(false);
    fetchRiders();
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Delivery Riders</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600"
        >
          <Plus size={16} /> Add Rider
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-700">Add New Rider</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
            <input
              placeholder="Phone (03XX-XXXXXXX)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={addRider} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">
              Add Rider
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {riders.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl p-8 text-center text-gray-400">
            No riders added yet
          </div>
        )}
        {riders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
              {rider.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800">{rider.name}</p>
              <a href={`tel:${rider.phone}`} className="text-sm text-gray-500 flex items-center gap-1 hover:text-orange-500">
                <Phone size={12} /> {rider.phone}
              </a>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
