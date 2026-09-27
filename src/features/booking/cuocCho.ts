/** Tín hiệu gọi tới trước khi hộp chat của buổi đó được dựng. */

export interface TinHieuGoi {
  type: string;
  payload?: string;
  video?: boolean;
  bookingId?: string;
  fromUserId?: string;
  fromName?: string;
}

let cho: TinHieuGoi | null = null;

/** Giữ lời mời gọi để hộp chat lấy lại ngay khi vừa mở. */
export function deCuocCho(tin: TinHieuGoi) {
  if (tin.type === "OFFER") cho = tin;
}

/** Lấy rồi xoá, để chuông không reo lần hai. */
export function layCuocCho(bookingId: string): TinHieuGoi | null {
  if (!cho || cho.type !== "OFFER") return null;
  if (cho.bookingId && cho.bookingId !== bookingId) return null;
  const tin = cho;
  cho = null;
  return tin;
}
