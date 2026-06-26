"use client";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

type Settings = {
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  min_order: string;
  is_open: string;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function save() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="p-4 text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="p-4 md:p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm">Shop Information</h2>

        {[
          { key: "shop_name", label: "Shop Name" },
          { key: "shop_phone", label: "Phone Number" },
          { key: "shop_address", label: "Address" },
          { key: "min_order", label: "Minimum Order (Rs.)", type: "number" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input
              type={type ?? "text"}
              value={settings[key as keyof Settings]}
              onChange={(e) => setSettings((s) => s ? { ...s, [key]: e.target.value } : s)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        ))}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700">Shop Status</p>
            <p className="text-sm text-gray-500">
              {settings.is_open === "true" ? "Currently accepting orders" : "Shop is closed"}
            </p>
          </div>
          <button
            onClick={() => setSettings((s) => s ? { ...s, is_open: s.is_open === "true" ? "false" : "true" } : s)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              settings.is_open === "true"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {settings.is_open === "true" ? "Open" : "Closed"}
          </button>
        </div>
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors w-full justify-center"
      >
        <Save size={16} />
        {saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
