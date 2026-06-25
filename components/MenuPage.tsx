"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, X, Plus, Minus, ChevronDown } from "lucide-react";
import { useCart } from "@/store/cart";
import type { Product, Category, ProductVariant } from "@/lib/types";
import Link from "next/link";

type MenuData = {
  products: Product[];
  categories: Category[];
};

export default function MenuPage() {
  const [data, setData] = useState<MenuData | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const cart = useCart();
  const categoryRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d: MenuData) => {
        setData(d);
        if (d.categories.length > 0) setActiveCategory(d.categories[0].id);
      });
  }, []);

  function scrollToCategory(catId: number) {
    setActiveCategory(catId);
    const el = categoryRefs.current.get(catId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedVariant(product.variants?.[0] ?? null);
  }

  function addToCart() {
    if (!selectedProduct) return;
    const price = selectedProduct.price + (selectedVariant?.price_delta ?? 0);
    cart.addItem({
      product_id: selectedProduct.id,
      variant_id: selectedVariant?.id ?? null,
      name: selectedProduct.name,
      variant_name: selectedVariant?.name ?? null,
      qty: 1,
      unit_price: price,
    });
    setSelectedProduct(null);
    setCartOpen(true);
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-orange-500 font-semibold">Loading menu...</p>
        </div>
      </div>
    );
  }

  const productsByCategory = new Map<number, Product[]>();
  for (const p of data.products) {
    if (!productsByCategory.has(p.category_id)) productsByCategory.set(p.category_id, []);
    productsByCategory.get(p.category_id)!.push(p);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg">B</div>
            <div>
              <h1 className="font-bold text-lg leading-none">Brewkie</h1>
              <p className="text-xs text-gray-500">Fresh Juices & Shakes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/track" className="text-sm text-orange-600 hover:underline hidden sm:block">
              Track Order
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart size={20} />
              {cart.count() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cart.count()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="font-semibold text-sm">Free delivery on orders above Rs. 1000 | Order now, delivered fresh!</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="overflow-x-auto scrollbar-hide border-b border-gray-100">
          <div className="flex gap-0 px-4 max-w-5xl mx-auto">
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-orange-500"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-5xl mx-auto px-4 pb-32">
        {data.categories.map((cat) => {
          const products = productsByCategory.get(cat.id) ?? [];
          if (!products.length) return null;
          return (
            <section
              key={cat.id}
              ref={(el) => { if (el) categoryRefs.current.set(cat.id, el); }}
              className="mt-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onOpen={openProduct} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating cart button (mobile) */}
      {cart.count() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-5 shadow-xl"
          >
            <span className="bg-orange-600 rounded-full px-2 py-0.5 text-sm">{cart.count()}</span>
            <span>View Cart</span>
            <span>Rs. {cart.total().toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                {selectedProduct.description && (
                  <p className="text-gray-500 text-sm mt-1">{selectedProduct.description}</p>
                )}
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Choose Size</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedVariant?.id === v.id
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-700 hover:border-orange-300"
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="font-bold">
                        Rs. {(selectedProduct.price + v.price_delta).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-gray-500 text-sm">Price</p>
                <p className="text-2xl font-bold text-orange-600">
                  Rs. {(selectedProduct.price + (selectedVariant?.price_delta ?? 0)).toLocaleString()}
                </p>
              </div>
              <button
                onClick={addToCart}
                className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <CartSidebar onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const cart = useCart();
  const inCart = cart.items.filter((i) => i.product_id === product.id);
  const totalQty = inCart.reduce((s, i) => s + i.qty, 0);

  const colors = ["bg-orange-100", "bg-yellow-100", "bg-green-100", "bg-blue-100", "bg-purple-100", "bg-pink-100"];
  const color = colors[product.id % colors.length];
  const emojis = ["🥤", "🧃", "🍹", "🥛", "🍊", "🫐"];
  const emoji = emojis[product.id % emojis.length];

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpen(product)}
    >
      <div className={`${color} h-32 flex items-center justify-center text-5xl`}>
        {emoji}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-orange-600">Rs. {product.price.toLocaleString()}</span>
          {product.variants && product.variants.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              sizes <ChevronDown size={12} />
            </span>
          )}
          {totalQty > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {totalQty} in cart
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CartSidebar({ onClose }: { onClose: () => void }) {
  const cart = useCart();

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Your Cart</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
            <ShoppingCart size={40} />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.map((item) => (
                <div key={`${item.product_id}-${item.variant_id}`} className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-gray-500">{item.variant_name}</p>
                    )}
                    <p className="text-orange-600 font-bold text-sm">
                      Rs. {(item.unit_price * item.qty).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cart.updateQty(item.product_id, item.variant_id, item.qty - 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => cart.updateQty(item.product_id, item.variant_id, item.qty + 1)}
                      className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-orange-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal ({cart.count()} items)</span>
                <span>Rs. {cart.total().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Delivery fee calculated at checkout</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-center hover:bg-orange-600 transition-colors mt-2"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
