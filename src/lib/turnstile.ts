// Giữ token Cloudflare Turnstile giữa widget và lớp gọi API.
//
// Vì sao là kho dùng chung chứ không phải một prop truyền xuống: token sinh ra
// ở một component trong modal, nhưng nơi cần nó là `src/api/auth.ts`, cách đó
// ba tầng (AuthModal → auth-context → authApi). Luồn thêm một tham số qua cả
// ba tầng chỉ để chở một chuỗi là đổi chữ ký của những hàm chẳng liên quan gì
// tới chống bot. `tokenStore` trong `src/api/client.ts` đã giải quyết đúng bài
// toán này theo đúng cách đó — làm giống cho nhất quán.
//
// Token Turnstile CHỈ DÙNG ĐƯỢC MỘT LẦN. Gọi xong phải xin cái mới, nếu không
// thì lần đăng nhập sai mật khẩu đầu tiên sẽ khiến mọi lần thử sau đó hỏng với
// một thông báo chẳng liên quan gì tới mật khẩu.

/** Rỗng nghĩa là tính năng tắt — xem TurnstileGate. */
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

export function turnstileDangBat(): boolean {
  return TURNSTILE_SITE_KEY.trim().length > 0;
}

let token: string | null = null;
let xinLaiToken: (() => void) | null = null;

export const turnstileStore = {
  set(t: string | null) {
    token = t;
  },
  /** Cho TurnstileGate đăng ký cách xin token mới sau khi token cũ bị dùng. */
  dangKyXinLai(fn: (() => void) | null) {
    xinLaiToken = fn;
  },
  /**
   * Lấy token ra để gắn vào một request, đồng thời vứt nó đi và xin cái mới.
   *
   * <p>Trả null khi tính năng tắt hoặc widget chưa xong — lúc đó cứ gửi request
   * không kèm header. Backend đang tắt kiểm tra thì vẫn chạy; backend đang bật
   * thì trả 400 kèm câu "tải lại trang rồi thử lại", đúng thứ người dùng cần
   * đọc.
   */
  dung(): string | null {
    const t = token;
    token = null;
    if (t) xinLaiToken?.();
    return t;
  },
};

/** Header để gắn vào request, hoặc object rỗng nếu không có token. */
export function turnstileHeader(): Record<string, string> {
  const t = turnstileStore.dung();
  return t ? { "X-Turnstile-Token": t } : {};
}
