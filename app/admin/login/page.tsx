"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">B</div>
          <h1 className="text-2xl font-bold text-gray-800">Brewkie Admin</h1>
          <p className="text-gray-500 text-sm">Sign in to manage orders</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Default: admin / admin123</p>
      </div>
    </div>
  );
}
