import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { SubscriptionManagement } from "@/components/subscription";
import { ArrowLeft, Sparkles, LogIn } from "lucide-react";

export const Route = createFileRoute("/profile_/subscription")({
  head: () => ({ meta: [{ title: "Gói cước AI Tarot — ASTROTAROT" }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate({ to: "/admin" });
    }
  }, [user, navigate]);

  // Nhận kết quả quay về từ PayOS.
  //
  // Cổng thanh toán trả người dùng về đây kèm ?payment=success hoặc
  // ?payment=cancel. Trước đây trang không đọc tham số ấy: trả tiền xong quay
  // lại là thấy đúng màn hình cũ, không một lời nào. Người ta không biết tiền
  // đã vào chưa, và hay trả thêm lần nữa.
  //
  // Gói do webhook của máy chủ kích hoạt chứ không do trang này, nên chỉ cần
  // nạp lại danh sách lượt mua. Webhook có thể tới chậm hơn người dùng vài
  // giây — vì vậy câu thông báo nói "đang xác nhận" chứ không khẳng định đã
  // xong, để lúc danh sách chưa kịp đổi thì người đọc cũng không hoang mang.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const kq = new URLSearchParams(window.location.search).get("payment");
    if (!kq) return;

    if (kq === "success") {
      toast.success("Đã nhận thanh toán, đang xác nhận gói của bạn…");
      // Đúng những khoá mà PurchaseModal làm mới sau một lượt mua bằng ví.
      // Đặt sai khoá thì lệnh làm mới chạy mà chẳng truy vấn nào nghe thấy.
      for (const khoa of [
        ["subscriptions"],
        ["subscription"],
        ["ai-usage"],
        ["user-wallet"],
      ]) {
        void queryClient.invalidateQueries({ queryKey: khoa });
      }
    } else if (kq === "cancel") {
      toast("Bạn đã huỷ thanh toán. Gói chưa được kích hoạt.");
    }

    // Dọn tham số khỏi thanh địa chỉ, không thì người dùng tải lại trang là
    // thông báo hiện lần nữa.
    window.history.replaceState({}, "", window.location.pathname);
  }, [queryClient]);

  if (user?.role === "admin") return null;

  return (
    <div className="relative min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          {user ? (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại Hồ sơ cá nhân
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại Trang chủ
            </Link>
          )}

          {!user && (
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Đăng nhập tài khoản
            </button>
          )}
        </div>

        {!user && (
          <div className="glass rounded-2xl border-gold/30 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  Trải nghiệm Tarot AI không giới hạn
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đăng nhập tài khoản để nhận 3 lượt hỏi miễn phí mỗi ngày hoặc đăng ký gói cước mở rộng.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAuth("login")}
              className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-background hover:bg-gold/90 transition shrink-0"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        <SubscriptionManagement />
      </main>
    </div>
  );
}
