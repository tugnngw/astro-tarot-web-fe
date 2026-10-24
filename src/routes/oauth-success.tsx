import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { doiMaLayToken } from "@/api/dang-nhap-google";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/oauth-success")({
  component: TrangQuayVeTuGoogle,
});

/**
 * Chặng cuối của luồng đăng nhập Google.
 *
 * <p>Máy chủ đưa người dùng về đây kèm `?code=...` — một mã dùng-một-lần,
 * không phải token. Trang này đổi mã lấy token rồi đưa họ đi tiếp.
 *
 * <p>Vì sao không để máy chủ trả thẳng token: máy chủ đưa người dùng về bằng
 * một lần chuyển hướng, nên token sẽ phải nằm trong THANH ĐỊA CHỈ — chỗ bị
 * lưu vào lịch sử trình duyệt, bị gửi kèm làm referrer sang trang khác, và
 * hiện nguyên trên màn hình.
 */
function TrangQuayVeTuGoogle() {
  const navigate = useNavigate();
  const { dangNhapXongBangGoogle } = useAuth();
  const [loi, setLoi] = useState<string | null>(null);

  // React 18 gọi effect hai lần ở chế độ nghiêm ngặt. Mã này dùng MỘT lần —
  // lần đổi thứ hai chắc chắn hỏng, và người dùng thấy báo lỗi dù vừa đăng
  // nhập thành công.
  const daChay = useRef(false);

  useEffect(() => {
    if (daChay.current) return;
    daChay.current = true;

    const ma = new URLSearchParams(window.location.search).get("code");
    if (!ma) {
      setLoi("Thiếu mã đăng nhập. Hãy thử đăng nhập lại từ trang chủ.");
      return;
    }

    doiMaLayToken(ma)
      .then((res) => {
        dangNhapXongBangGoogle(res);
        // `replace` để nút Back không đưa người dùng ngược về trang này —
        // quay lại đây là đổi một mã đã dùng, và họ gặp lỗi ngay sau khi
        // vừa đăng nhập xong.
        void navigate({ to: "/", replace: true });
      })
      .catch((e: unknown) => {
        setLoi(
          e instanceof Error
            ? e.message
            : "Không hoàn tất được đăng nhập. Hãy thử lại.",
        );
      });
  }, [dangNhapXongBangGoogle, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-sm rounded-2xl border border-gold/30 p-6 text-center">
        {loi ? (
          <>
            <p className="text-sm text-destructive-soft">{loi}</p>
            <button
              onClick={() => void navigate({ to: "/", replace: true })}
              className="mt-4 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground"
            >
              Về trang chủ
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">
              Đang hoàn tất đăng nhập…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
