import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { SubscriptionManagement } from "@/components/subscription";
import { Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/profile_/subscription")({
  head: () => ({ meta: [{ title: "Gói cước AI Tarot — ASTROTAROT" }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user, openAuth } = useAuth();

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="glass rounded-3xl border-gold/20 p-12 sm:p-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl text-foreground">
              Đăng nhập để xem gói cước AI
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Đăng nhập tài khoản ASTROTAROT để theo dõi hạn mức câu hỏi hàng ngày và đăng ký gói AI trải bài nâng cao.
            </p>
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-background glow-gold transition hover:bg-gold/90"
            >
              Đăng nhập ngay
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Hồ sơ cá nhân
          </Link>
        </div>

        <SubscriptionManagement />
      </main>
    </div>
  );
}
