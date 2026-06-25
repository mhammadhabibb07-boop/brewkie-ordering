export type Category = {
  id: number;
  name: string;
  sort_order: number;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  name: string;
  price_delta: number;
};

export type Product = {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: number;
  sort_order: number;
  variants?: ProductVariant[];
};

export type CartItem = {
  product_id: number;
  variant_id: number | null;
  name: string;
  variant_name: string | null;
  qty: number;
  unit_price: number;
};

export type DeliveryZone = {
  id: number;
  name: string;
  fee: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type Order = {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  address: string;
  delivery_zone_id: number | null;
  zone_name?: string | null;
  rider_id: number | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  notes: string | null;
  otp: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  name: string;
  variant_name: string | null;
  qty: number;
  unit_price: number;
  total_price: number;
};

export type Rider = {
  id: number;
  name: string;
  phone: string;
  active: number;
  created_at: string;
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
