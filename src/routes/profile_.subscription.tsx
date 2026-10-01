import { createFileRoute, Link } from "@tanstack/react-router";
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
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Đăng nhập tài khoản
            </button>
          )}
        </div>

        {!user && (
          <div className="glass rounded-2xl border-gold/25 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold shrink-0">
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
