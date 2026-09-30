import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { SubscriptionManagement } from "@/components/subscription";

export const Route = createFileRoute("/profile_/subscription")({
  head: () => ({ meta: [{ title: "Quản lý gói AI — ASTROTAROT" }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user, openAuth } = useAuth();

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="glass rounded-2xl p-16 text-center">
            <h1 className="font-display text-2xl">Đăng nhập để quản lý gói AI</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn cần đăng nhập để xem và mua gói dịch vụ AI.
            </p>
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
            >
              Đăng nhập
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">
          Quản lý <span className="text-gradient-gold">gói AI</span>
        </h1>

        <div className="mt-8">
          <SubscriptionManagement />
        </div>
      </main>
    </div>
  );
}