// ============================================================
// MINI GAME "GIAO HỘI" — xếp ba biểu tượng, điểm đổi ra lượt AI
// Khớp với BE: /api/v1/game/**
//
// Không có hàm nào ở đây gửi điểm lên. Đó là cố ý, không phải sót:
// điểm đổi được ra lượt AI, mà một lượt AI là một lượt gọi Gemini có hoá
// đơn thật — nên máy chủ giữ bàn chơi và tự tính điểm. Trình duyệt chỉ
// nói "đổi ô này với ô kia" rồi diễn lại kết quả máy chủ trả về.
// ============================================================

import { apiFetch } from "./client";

const BASE = "/api/v1/game";

/** Mã nhân vật, khớp enum NhanVat ở BE. */
export type MaNhanVat = "LUNA" | "SOL" | "ASTRA";

export interface NhanVat {
  ma: MaNhanVat;
  ten: string;
  tenKiNang: string;
  moTaKiNang: string;
  nangLuongCan: number;
}

/** Một bậc của dây chuyền, để giao diện diễn lại từng nhịp. */
export interface BuocXoa {
  /** Chỉ số ô vừa biến mất, đã sắp tăng dần. */
  cacOXoa: number[];
  /** Bàn ngay sau khi xoá: ô mất mang ký tự "0", chưa ai rơi. */
  bangSauXoa: string;
  /** Bàn sau khi rơi và rót ô mới. */
  bangSau: string;
  diem: number;
  /** Hệ số dây chuyền của bậc này: 1, 1.5, 2, ... */
  heSo: number;
  /** Bậc thứ mấy, đếm từ 1. */
  bac: number;
}

export interface Phien {
  id: string;
  nhanVat: NhanVat;
  /** Bàn 7×7 dưới dạng 49 ký tự. */
  bang: string;
  diem: number;
  luotConLai: number;
  nangLuong: number;
  nangLuongCan: number;
  daChot: boolean;
}

export interface Thuong {
  /** Điểm của phiên này ĐƯỢC TÍNH vào quy đổi — nhỏ hơn điểm phiên khi đã chạm trần. */
  diemTinhVaoQuyDoi: number;
  luotVuaNhan: number;
  diemDaTinhHomNay: number;
  luotDaNhanHomNay: number;
  diemConDuocTinh: number;
  luotConDuocNhan: number;
}

export interface NuocDi {
  cacBuoc: BuocXoa[];
  diemThem: number;
  /** Bàn đã hết nước đi nên máy chủ trộn lại các ô. */
  daDaoBan: boolean;
  phien: Phien;
  /** Chỉ có khi nước đi này làm hết lượt và phiên vừa chốt. */
  thuong: Thuong | null;
}

export interface TrangThaiGame {
  canhBan: number;
  luotMoiPhien: number;
  diemMoiLuot: number;
  tranDiemNgay: number;
  tranLuotNgay: number;
  diemDaTinhHomNay: number;
  luotDaNhanHomNay: number;
  diemConDuocTinh: number;
  luotConDuocNhan: number;
  cacNhanVat: NhanVat[];
  /** Phiên đang chơi dở, để mở lại trang là chơi tiếp. Null khi chưa có. */
  phienDangMo: Phien | null;
}

export function layTrangThai(): Promise<TrangThaiGame> {
  return apiFetch<TrangThaiGame>(`${BASE}/trang-thai`);
}

/** Mở phiên mới. Phiên cũ còn dở được máy chủ chốt và thưởng trước. */
export function batDauPhien(nhanVat: MaNhanVat): Promise<TrangThaiGame> {
  return apiFetch<TrangThaiGame>(`${BASE}/phien`, {
    method: "POST",
    body: JSON.stringify({ nhanVat }),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Đổi chỗ hai ô kề nhau.
 *
 * Nước không tạo được chuỗi nào bị máy chủ trả 400 và KHÔNG tốn lượt, nên
 * giao diện chỉ việc hiện lời nhắc rồi bỏ chọn — không phải tải lại gì.
 */
export function doiCho(
  phienId: string,
  o1: number,
  o2: number,
): Promise<NuocDi> {
  return apiFetch<NuocDi>(`${BASE}/phien/${phienId}/doi-cho`, {
    method: "POST",
    body: JSON.stringify({ o1, o2 }),
    headers: { "Content-Type": "application/json" },
  });
}

/** Dùng kĩ năng nhân vật, nhắm vào một ô. Không tốn lượt đổi chỗ. */
export function dungKiNang(phienId: string, o: number): Promise<NuocDi> {
  return apiFetch<NuocDi>(`${BASE}/phien/${phienId}/ki-nang`, {
    method: "POST",
    body: JSON.stringify({ o }),
    headers: { "Content-Type": "application/json" },
  });
}
