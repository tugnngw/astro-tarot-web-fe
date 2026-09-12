import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import * as authApi from "@/api/auth";

/**
 * Trang người dùng rơi vào khi bấm link trong email xác minh.
 * BE sinh link dạng {frontend-url}/verify-email?token=...
 */
export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Xác minh email — ASTROTAROT" }] }),
  component: VerifyEmailPage,
});

type State = "verifying" | "success" | "error";

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const { openAuth } = useAuth();

  const [state, setState] = useState<State>(token ? "verifying" : "error");
  const [message, setMessage] = useState(
    token ? "" : "Liên kết không hợp lệ — thiếu mã xác minh.",
  );
  const [email, setEmail] = useState("");

  // React 18 StrictMode gọi effect hai lần ở môi trường dev. Token chỉ dùng
  // được MỘT lần nên lần gọi thứ hai chắc chắn trả lỗi và ghi đè kết quả
  // thành công. Chốt lại bằng ref để chỉ gửi đúng một request.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;

    authApi
      .verifyEmail(token)
      .then((res) => {
        setEmail(res.email);
        setState("success");
      })
      .catch((e: unknown) => {
        setMessage(
          e instanceof Error ? e.message : "Xác minh thất bại, thử lại sau.",
        );
        setState("error");
      });
  }, [token]);

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4">
        <div className="glass w-full rounded-2xl p-8 text-center">
          {state === "verifying" && (
            <>
              <Loader2
                aria-hidden="true"
                className="mx-auto h-10 w-10 animate-spin text-gold"
              />
              <h1 className="mt-5 font-display text-2xl">Đang xác minh...</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Chờ một chút nhé.
              </p>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2
                aria-hidden="true"
                className="mx-auto h-12 w-12 text-emerald-400"
              />
              <h1 className="mt-5 font-display text-2xl text-gradient-gold">
                Xác minh thành công
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tài khoản <span className="text-foreground">{email}</span> đã
                được kích hoạt. Bạn có thể đăng nhập ngay.
              </p>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
              >
                Đăng nhập
              </button>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle
                aria-hidden="true"
                className="mx-auto h-12 w-12 text-destructive"
              />
              <h1 className="mt-5 font-display text-2xl">
                Không xác minh được
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {message}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Liên kết chỉ dùng được một lần và hết hạn sau 24 giờ. Nếu đã quá
                hạn, hãy đăng nhập để hệ thống gửi lại liên kết mới.
              </p>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="mt-6 w-full rounded-full border border-gold/50 py-2.5 text-sm text-gold transition hover:bg-gold/10"
              >
                Tới trang đăng nhập
              </button>
              <Link
                to="/"
                className="mt-3 inline-block text-sm text-muted-foreground hover:text-gold"
              >
                Về trang chủ
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
