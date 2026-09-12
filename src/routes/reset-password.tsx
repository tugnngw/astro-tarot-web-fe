import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import * as authApi from "@/api/auth";

/**
 * Trang đặt lại mật khẩu, mở từ link trong email.
 * BE sinh link dạng {frontend-url}/reset-password?token=...
 */
export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Đặt lại mật khẩu — ASTROTAROT" }] }),
  component: ResetPasswordPage,
});

/** Khớp với @Size(min = 8) ở ResetPasswordRequest của BE. */
const MIN_PASSWORD = 8;

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const { openAuth } = useAuth();

  const pwdId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD)
      next.password = `Mật khẩu phải từ ${MIN_PASSWORD} ký tự`;
    if (confirm !== password) next.confirm = "Mật khẩu nhập lại không khớp";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (e2) {
      toast.error(
        e2 instanceof Error ? e2.message : "Đặt lại mật khẩu thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4">
        <div className="glass w-full rounded-2xl p-8">
          {!token ? (
            <div className="text-center">
              <XCircle
                aria-hidden="true"
                className="mx-auto h-12 w-12 text-destructive"
              />
              <h1 className="mt-5 font-display text-2xl">
                Liên kết không hợp lệ
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Thiếu mã đặt lại mật khẩu. Hãy yêu cầu lại từ màn hình đăng
                nhập.
              </p>
              <button
                type="button"
                onClick={() => openAuth("forgot")}
                className="mt-6 w-full rounded-full border border-gold/50 py-2.5 text-sm text-gold transition hover:bg-gold/10"
              >
                Yêu cầu liên kết mới
              </button>
            </div>
          ) : done ? (
            <div className="text-center">
              <CheckCircle2
                aria-hidden="true"
                className="mx-auto h-12 w-12 text-emerald-400"
              />
              <h1 className="mt-5 font-display text-2xl text-gradient-gold">
                Đã đổi mật khẩu
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Mật khẩu mới đã được lưu. Mọi thiết bị đang đăng nhập đã bị đăng
                xuất để bảo vệ tài khoản.
              </p>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
              >
                Đăng nhập
              </button>
              <Link
                to="/"
                className="mt-3 inline-block text-sm text-muted-foreground hover:text-gold"
              >
                Về trang chủ
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl text-gradient-gold">
                Đặt mật khẩu mới
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Chọn mật khẩu mới cho tài khoản của bạn ✦
              </p>

              <form onSubmit={submit} noValidate className="mt-6 space-y-4">
                <div>
                  <label htmlFor={pwdId} className="sr-only">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id={pwdId}
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={`Mật khẩu mới (tối thiểu ${MIN_PASSWORD} ký tự)`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      className={`w-full rounded-lg border bg-input/60 px-4 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-gold ${
                        errors.password
                          ? "border-destructive"
                          : "border-gold/30"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-gold"
                    >
                      {show ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={confirmId} className="sr-only">
                    Nhập lại mật khẩu
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id={confirmId}
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      aria-invalid={Boolean(errors.confirm)}
                      className={`w-full rounded-lg border bg-input/60 px-4 py-3 pl-10 text-sm outline-none transition focus:border-gold ${
                        errors.confirm ? "border-destructive" : "border-gold/30"
                      }`}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.confirm}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Liên kết chỉ dùng được một lần và hết hạn sau 1 giờ.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
