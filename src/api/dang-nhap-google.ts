import { API_BASE } from "./client";

/**
 * Đăng nhập Google, chặng một: rời khỏi trang sang Google.
 *
 * <p>Phải là một lần điều hướng THẬT của trình duyệt, không phải `fetch`.
 * Google chặn hiện màn đăng nhập trong khung nhúng hay qua XHR, và luồng còn
 * cần trình duyệt nhận cookie do máy chủ mình đặt để nhớ yêu cầu uỷ quyền.
 *
 * <p>Đường dẫn `/oauth2/authorization/google` là do Spring Security tự dựng,
 * không phải endpoint mình viết — đổi tên đăng ký client bên
 * `application.properties` là đổi luôn đoạn cuối.
 */
export function dangNhapBangGoogle(): void {
  window.location.assign(`${API_BASE}/oauth2/authorization/google`);
}

/**
 * Phản hồi của `/api/auth/oauth/exchange`.
 *
 * Phẳng, không bọc `user` — khác với `/auth/login`. Đây là `AuthResponse`
 * bên máy chủ, đọc thẳng từ DTO chứ không suy đoán.
 */
export interface PhanHoiDoiMa {
  userId: string;
  username: string;
  email: string | null;
  fullName: string | null;
  role: string;
  avatar: string | null;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
}

/**
 * Đăng nhập Google, chặng hai: đổi mã dùng-một-lần lấy token.
 *
 * <p>Vì sao phải có chặng này thay vì để máy chủ trả thẳng token: máy chủ
 * đưa người dùng về bằng một lần chuyển hướng, nên token sẽ phải nằm trong
 * THANH ĐỊA CHỈ. Chỗ đó bị lưu vào lịch sử trình duyệt, bị gửi kèm làm
 * referrer sang trang khác, và hiện nguyên trên màn hình. Mã đổi thì vô dụng
 * sau lần dùng đầu và chỉ sống vài phút.
 *
 * <p>Không dùng `apiFetch`: lúc này chưa có token nào để đính kèm, và một
 * lỗi 401 ở đây không được kích hoạt luồng làm mới phiên.
 */
export async function doiMaLayToken(ma: string): Promise<PhanHoiDoiMa> {
  const res = await fetch(`${API_BASE}/api/auth/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: ma }),
  });
  if (!res.ok) {
    throw new Error("Mã đăng nhập không còn dùng được. Hãy thử đăng nhập lại.");
  }
  return (await res.json()) as PhanHoiDoiMa;
}
