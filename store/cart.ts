"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number, variant_id: number | null) => void;
  updateQty: (product_id: number, variant_id: number | null, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id && i.variant_id === item.variant_id
                  ? { ...i, qty: i.qty + item.qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (product_id, variant_id) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === product_id && i.variant_id === variant_id)
          ),
        }));
      },
      updateQty: (product_id, variant_id, qty) => {
        if (qty <= 0) {
          get().removeItem(product_id, variant_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === product_id && i.variant_id === variant_id ? { ...i, qty } : i
          ),
        }));
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.unit_price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "brewkie-cart" }
  )
);
