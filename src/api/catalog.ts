// ============================================================
// CATALOG ADMIN API — quản lý sản phẩm liên kết
// Khớp với BE: /api/v1/admin/products, /api/v1/admin/affiliate/stats
// ============================================================

import { apiFetch } from "./client";
import type { Paged } from "./money";
import type { Product } from "./shop";

const BASE = "/api/v1/admin";

export const PLATFORMS = [
  "SHOPEE",
  "LAZADA",
  "TIKI",
  "TIKTOK",
  "OTHER",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface SaveProductPayload {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  imageIsIllustrative?: boolean;
  affiliateUrl?: string | null;
  affiliatePlatform?: Platform;
  commissionPercent?: number;
  featured?: boolean;
  active?: boolean;
  categoryId?: string | null;
}

export interface AffiliateStats {
  totalClicks: number;
  clicksInPeriod: number;
  periodDays: number;
  productsWithLink: number;
  productsWithoutLink: number;
  /** ƯỚC LƯỢNG (giá × tỉ lệ × lượt bấm), KHÔNG phải doanh thu thật. */
  estimatedCommission: number;
  topProducts: Product[];
}

export function getAdminProducts(
  query: { keyword?: string; page?: number; size?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<Paged<Product>>(`${BASE}/products${qs ? `?${qs}` : ""}`);
}

export function createProduct(payload: SaveProductPayload) {
  return apiFetch<Product>(`${BASE}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: string, payload: SaveProductPayload) {
  return apiFetch<Product>(`${BASE}/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function setProductActive(id: string, value: boolean) {
  return apiFetch<Product>(`${BASE}/products/${id}/active?value=${value}`, {
    method: "PATCH",
  });
}

export function getAffiliateStats(days = 30) {
  return apiFetch<AffiliateStats>(`${BASE}/affiliate/stats?days=${days}`);
}
