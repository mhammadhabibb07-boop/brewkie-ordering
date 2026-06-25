"use client";
import { useState, useEffect } from "react";
import { Plus, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import type { Product, Category } from "@/lib/types";

type MenuData = { categories: Category[]; products: Product[] };

export default function AdminMenu() {
  const [data, setData] = useState<MenuData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", category_id: "" });
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null);

  async function fetchMenu() {
    const res = await fetch("/api/admin/menu");
    setData(await res.json());
  }

  useEffect(() => { fetchMenu(); }, []);

  async function toggleProduct(id: number) {
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_product", id }),
    });
    fetchMenu();
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) return;
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_product", ...newProduct, price: Number(newProduct.price) }),
    });
    setNewProduct({ name: "", description: "", price: "", category_id: "" });
    setShowAdd(false);
    fetchMenu();
  }

  async function savePrice() {
    if (!editingPrice) return;
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_price", id: editingPrice.id, price: Number(editingPrice.price) }),
    });
    setEditingPrice(null);
    fetchMenu();
  }

  if (!data) return <div className="p-6 text-gray-400">Loading menu...</div>;

  const productsByCategory = new Map<number, Product[]>();
  for (const p of data.products) {
    if (!productsByCategory.has(p.category_id)) productsByCategory.set(p.category_id, []);
    productsByCategory.get(p.category_id)!.push(p);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-700">Add New Item</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct((f) => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
            <input
              placeholder="Price (Rs.)"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct((f) => ({ ...f, price: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <input
            placeholder="Description (optional)"
            value={newProduct.description}
            onChange={(e) => setNewProduct((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <select
            value={newProduct.category_id}
            onChange={(e) => setNewProduct((f) => ({ ...f, category_id: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400"
          >
            <option value="">Select category</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={addProduct} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">
              Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {data.categories.map((cat) => {
        const products = productsByCategory.get(cat.id) ?? [];
        return (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-bold text-gray-700">{cat.name}</h2>
            </div>
            <div className="divide-y">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <p className={`font-medium ${!p.available ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {p.name}
                    </p>
                    {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {editingPrice?.id === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingPrice.price}
                          onChange={(e) => setEditingPrice({ id: p.id, price: e.target.value })}
                          className="w-24 border border-orange-300 rounded-lg px-2 py-1 text-sm"
                        />
                        <button onClick={savePrice} className="text-green-600 text-xs font-medium px-2 py-1 hover:bg-green-50 rounded">Save</button>
                        <button onClick={() => setEditingPrice(null)} className="text-gray-400 text-xs px-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPrice({ id: p.id, price: String(p.price) })}
                        className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-orange-600"
                      >
                        Rs. {p.price.toLocaleString()}
                        <Pencil size={12} className="text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleProduct(p.id)}
                      className={p.available ? "text-green-500 hover:text-green-700" : "text-gray-400 hover:text-gray-600"}
                      title={p.available ? "Available — click to hide" : "Hidden — click to show"}
                    >
                      {p.available ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="px-5 py-4 text-sm text-gray-400">No items in this category</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
