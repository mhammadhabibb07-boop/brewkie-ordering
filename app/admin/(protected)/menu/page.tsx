"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2, ChevronDown, ImagePlus, X } from "lucide-react";
import type { Product, Category } from "@/lib/types";

type MenuData = { categories: Category[]; products: Product[] };
type Modal = "add_item" | "add_category" | "remove_item" | "remove_category" | null;

export default function AdminMenu() {
  const [data, setData] = useState<MenuData | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null);

  // Add item form
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category_id: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Add category form
  const [newCatName, setNewCatName] = useState("");

  // Remove selections
  const [removeItemId, setRemoveItemId] = useState("");
  const [removeCatId, setRemoveCatId] = useState("");

  async function fetchMenu() {
    const res = await fetch("/api/admin/menu");
    setData(await res.json());
  }

  useEffect(() => { fetchMenu(); }, []);

  function openModal(m: Modal) {
    setModal(m);
    setDropdownOpen(false);
  }

  function closeModal() {
    setModal(null);
    setNewItem({ name: "", description: "", price: "", category_id: "" });
    setImageFile(null);
    setImagePreview(null);
    setNewCatName("");
    setRemoveItemId("");
    setRemoveCatId("");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function compressImage(file: File, maxSize = 400): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = url;
    });
  }

  async function addItem() {
    if (!newItem.name || !newItem.price || !newItem.category_id) return;
    setUploading(true);
    let image_url: string | null = null;
    if (imageFile) {
      image_url = await compressImage(imageFile);
    }
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_product", ...newItem, price: Number(newItem.price), image_url }),
    });
    setUploading(false);
    closeModal();
    fetchMenu();
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_category", name: newCatName.trim() }),
    });
    closeModal();
    fetchMenu();
  }

  async function removeItem() {
    if (!removeItemId) return;
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_product", id: Number(removeItemId) }),
    });
    closeModal();
    fetchMenu();
  }

  async function removeCategory() {
    if (!removeCatId) return;
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_category", id: Number(removeCatId) }),
    });
    closeModal();
    fetchMenu();
  }

  async function toggleProduct(id: number) {
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_product", id }),
    });
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

  if (!data) return <div className="p-4 text-sm text-gray-400">Loading menu…</div>;

  const productsByCategory = new Map<number, Product[]>();
  for (const p of data.products) {
    if (!productsByCategory.has(p.category_id)) productsByCategory.set(p.category_id, []);
    productsByCategory.get(p.category_id)!.push(p);
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400";
  const btnPrimary = "w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50";
  const btnGhost = "w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors";
  const btnDanger = "w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Menu</h1>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={15} />
            Manage
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-20">
                <button onClick={() => openModal("add_item")} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Plus size={15} className="text-orange-500" /> Add Menu Item
                </button>
                <button onClick={() => openModal("add_category")} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <Plus size={15} className="text-blue-500" /> Add Category
                </button>
                <button onClick={() => openModal("remove_item")} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <Trash2 size={15} className="text-red-400" /> Remove Menu Item
                </button>
                <button onClick={() => openModal("remove_category")} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <Trash2 size={15} className="text-red-400" /> Remove Category
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Menu list */}
      {data.categories.map((cat) => {
        const products = productsByCategory.get(cat.id) ?? [];
        return (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-sm text-gray-700">{cat.name}</h2>
            </div>
            <div className="divide-y">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${!p.available ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {p.name}
                    </p>
                    {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {editingPrice?.id === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingPrice.price}
                          onChange={(e) => setEditingPrice({ id: p.id, price: e.target.value })}
                          className="w-20 border border-orange-300 rounded-lg px-2 py-1 text-xs"
                        />
                        <button onClick={savePrice} className="text-green-600 text-xs font-medium px-2 py-1 hover:bg-green-50 rounded">✓</button>
                        <button onClick={() => setEditingPrice(null)} className="text-gray-400 text-xs px-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPrice({ id: p.id, price: String(p.price) })}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-orange-600"
                      >
                        Rs.{p.price.toLocaleString()}
                        <Pencil size={10} className="text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleProduct(p.id)}
                      className={p.available ? "text-green-500 hover:text-green-700" : "text-gray-300 hover:text-gray-500"}
                    >
                      {p.available ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="px-4 py-4 text-xs text-gray-400">No items in this category</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal overlay */}
      {modal && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            {/* Add Menu Item */}
            {modal === "add_item" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Add Menu Item</h2>
                  <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
                </div>
                {/* Image upload */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-gray-300 mb-1" />
                      <p className="text-xs text-gray-400">Tap to upload image</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                <input placeholder="Description (optional)" value={newItem.description} onChange={(e) => setNewItem((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Price (Rs.)" type="number" value={newItem.price} onChange={(e) => setNewItem((f) => ({ ...f, price: e.target.value }))} className={inputCls} />
                  <select value={newItem.category_id} onChange={(e) => setNewItem((f) => ({ ...f, category_id: e.target.value }))} className={inputCls + " bg-white"}>
                    <option value="">Category</option>
                    {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={addItem} disabled={uploading || !newItem.name || !newItem.price || !newItem.category_id} className={btnPrimary}>
                  {uploading ? "Saving…" : "Add Item"}
                </button>
                <button onClick={closeModal} className={btnGhost}>Cancel</button>
              </>
            )}

            {/* Add Category */}
            {modal === "add_category" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Add Category</h2>
                  <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
                </div>
                <input placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={inputCls} />
                <button onClick={addCategory} disabled={!newCatName.trim()} className={btnPrimary}>Add Category</button>
                <button onClick={closeModal} className={btnGhost}>Cancel</button>
              </>
            )}

            {/* Remove Menu Item */}
            {modal === "remove_item" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Remove Menu Item</h2>
                  <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
                </div>
                <p className="text-xs text-gray-500">This will permanently delete the item and its order history.</p>
                <select value={removeItemId} onChange={(e) => setRemoveItemId(e.target.value)} className={inputCls + " bg-white"}>
                  <option value="">Select item to remove</option>
                  {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.category_name}</option>)}
                </select>
                <button onClick={removeItem} disabled={!removeItemId} className={btnDanger}>Remove Item</button>
                <button onClick={closeModal} className={btnGhost}>Cancel</button>
              </>
            )}

            {/* Remove Category */}
            {modal === "remove_category" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Remove Category</h2>
                  <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
                </div>
                <p className="text-xs text-red-500">Warning: this will also delete all items in this category.</p>
                <select value={removeCatId} onChange={(e) => setRemoveCatId(e.target.value)} className={inputCls + " bg-white"}>
                  <option value="">Select category to remove</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={removeCategory} disabled={!removeCatId} className={btnDanger}>Remove Category</button>
                <button onClick={closeModal} className={btnGhost}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
