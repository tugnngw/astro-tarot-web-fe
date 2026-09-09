// ============================================================
// SHOP API — phần 3: bán vật phẩm tarot
// Khớp với BE: /api/v1/shop/**
//
// Catalog (categories, products) là public, không cần token.
// Giỏ hàng và đơn hàng cần đăng nhập.
// ============================================================

import { apiFetch } from "./client";

const BASE = "/api/v1/shop";

// ---------- Types (khớp DTO của BE, camelCase) ----------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  /** Giá gạch ngang khi đang giảm giá. Null nếu không giảm. */
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  /** true khi imageUrl là ảnh minh hoạ, không phải ảnh chụp đúng sản phẩm. */
  imageIsIllustrative?: boolean;
  /** Đường dẫn sang sàn. NULL nghĩa là chưa gắn link — giao diện ẩn nút mua. */
  affiliateUrl: string | null;
  affiliatePlatform: string | null;
  /** Chỉ để ước lượng. Số hoa hồng thật lấy từ báo cáo của sàn. */
  commissionPercent: number | null;
  clickCount: number | null;
  featured: boolean;
  categoryName: string | null;
  categorySlug: string | null;
}

/** Page của Spring Data, chỉ lấy những field FE thực sự dùng. */
export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Tồn kho hiện tại, dùng để chặn tăng quá số lượng còn lại. */
  stock: number;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutPayload {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note?: string;
}

export interface ProductQuery {
  category?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

// ---------- Catalog (public) ----------

export function getCategories() {
  return apiFetch<Category[]>(`${BASE}/categories`, {}, { auth: false });
}

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.direction) params.set("direction", query.direction);

  const qs = params.toString();
  return apiFetch<ProductPage>(
    `${BASE}/products${qs ? `?${qs}` : ""}`,
    {},
    { auth: false },
  );
}

export function getFeaturedProducts() {
  return apiFetch<Product[]>(`${BASE}/products/featured`, {}, { auth: false });
}

export function getProduct(slug: string) {
  return apiFetch<Product>(
    `${BASE}/products/${encodeURIComponent(slug)}`,
    {},
    { auth: false },
  );
}

/**
 * Ghi nhận lượt bấm rồi trả về đường dẫn sang sàn.
 *
 * Server trả link để GIAO DIỆN tự mở, không dùng 302: mở bằng window.open ngay
 * trong cú bấm của người dùng thì trình duyệt không chặn popup, còn chuyển
 * hướng vòng qua server sẽ mất referrer mà sàn liên kết cần để ghi công.
 */
export function trackAffiliateClick(slug: string) {
  return apiFetch<{ url: string }>(
    `${BASE}/products/${encodeURIComponent(slug)}/click`,
    { method: "POST" },
    { auth: false },
  );
}

/** Nhãn sàn cho giao diện. */
export const PLATFORM_LABEL: Record<string, string> = {
  SHOPEE: "Shopee",
  LAZADA: "Lazada",
  TIKI: "Tiki",
  TIKTOK: "TikTok Shop",
  OTHER: "sàn liên kết",
};

// ---------- Giỏ hàng (cần đăng nhập) ----------
// Mọi thao tác đều trả về giỏ đầy đủ, nên caller chỉ cần thay nguyên state.

export function getCart() {
  return apiFetch<Cart>(`${BASE}/cart`);
}

export function addToCart(productId: string, quantity = 1) {
  return apiFetch<Cart>(`${BASE}/cart/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(cartItemId: string, quantity: number) {
  return apiFetch<Cart>(`${BASE}/cart/items/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(cartItemId: string) {
  return apiFetch<Cart>(`${BASE}/cart/items/${cartItemId}`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return apiFetch<void>(`${BASE}/cart`, { method: "DELETE" });
}

// ---------- Đơn hàng (cần đăng nhập) ----------

export function checkout(payload: CheckoutPayload) {
  return apiFetch<Order>(`${BASE}/orders/checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyOrders() {
  return apiFetch<Order[]>(`${BASE}/orders`);
}

export function getOrder(orderId: string) {
  return apiFetch<Order>(`${BASE}/orders/${orderId}`);
}

export function cancelOrder(orderId: string, reason?: string) {
  return apiFetch<Order>(`${BASE}/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? null }),
  });
}

// ---------- Nhãn tiếng Việt cho trạng thái ----------

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thanh toán lỗi",
};
