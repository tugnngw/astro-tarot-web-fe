import { apiFetch } from "./client";

export type LoaiGiam = "PHAN_TRAM" | "SO_TIEN";

export interface KhuyenMai {
  id: string;
  ten: string;
  loiChuc: string | null;
  loaiGiam: LoaiGiam;
  giaTri: number;
  giamToiDa: number | null;
  batDau: string;
  ketThuc: string;
  dangBat: boolean;
  /** Máy chủ tính sẵn — giao diện không tự so ngày với đồng hồ máy khách. */
  dangChay: boolean;
}

export interface LuuKhuyenMai {
  ten: string;
  loiChuc: string | null;
  loaiGiam: LoaiGiam;
  giaTri: number;
  giamToiDa: number | null;
  batDau: string;
  ketThuc: string;
  dangBat: boolean;
}

/**
 * Giá một gói sau khi áp đợt đang chạy.
 *
 * Máy chủ tính, giao diện chỉ hiện. Tự nhân phần trăm ở đây là bản cài đặt
 * thứ hai của cùng một phép tính, và chỉ cần quên cái trần giảm là trang
 * hiện một giá còn ví trừ một giá khác.
 */
export interface GiaSauGiam {
  giaGoc: number;
  tienGiam: number;
  giaCuoi: number;
  tenDot: string | null;
}

const BASE = "/api/v1/khuyen-mai";

export function getKhuyenMaiDangChay() {
  return apiFetch<KhuyenMai[]>(`${BASE}/dang-chay`);
}

/** Khoá là id gói. Gói không giảm vẫn có mặt, với `tienGiam = 0`. */
export function getGiaGoi() {
  return apiFetch<Record<string, GiaSauGiam>>(`${BASE}/gia-goi`);
}

/**
 * Lấy lời chúc chưa xem — và đánh dấu đã xem ngay trong lượt gọi này.
 *
 * Trả `null` khi không có gì để chúc (máy chủ trả 204). Gọi lần hai luôn
 * `null`, kể cả khi mở song song trên máy khác.
 */
export async function layLoiChuc(): Promise<KhuyenMai | null> {
  const kq = await apiFetch<KhuyenMai | null>(`${BASE}/loi-chuc`, {
    method: "POST",
  });
  return kq ?? null;
}

// ---- Quản trị ----

export function getTatCaKhuyenMai() {
  return apiFetch<KhuyenMai[]>(`${BASE}/admin`);
}

export function taoKhuyenMai(payload: LuuKhuyenMai) {
  return apiFetch<KhuyenMai>(`${BASE}/admin`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function suaKhuyenMai(id: string, payload: LuuKhuyenMai) {
  return apiFetch<KhuyenMai>(`${BASE}/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function xoaKhuyenMai(id: string) {
  return apiFetch<void>(`${BASE}/admin/${id}`, { method: "DELETE" });
}
