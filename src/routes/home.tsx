import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  CalendarCheck,
  History,
  Star,
  ShoppingBag,
  ArrowRight,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { RoleBadge } from "@/components/RoleBadge";
import { DailyCardDraw } from "@/components/DailyCardDraw";
import { Reveal } from "@/components/Reveal";
import { useAuth } from "@/lib/auth-context";
import { MemberSnapshot } from "@/features/home/components/MemberSnapshot";
import {
  homePathFor,
  type HomePath,
} from "@/lib/roles";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Không gian thành viên — ASTROTAROT" },
      {
        name: "description",
        content:
          "Không gian cá nhân: trải bài Tarot, lịch hẹn Reader, bản đồ sao và lịch sử của bạn.",
      },
    ],
  }),
  component: () => (
    <RoleGuard require={["USER_BASIC"]}>
      <UserHomePage />
    </RoleGuard>
  ),
});

const QUICK_LINKS = [
  {
    icon: Sparkles,
    title: "Trải bài Tarot AI",
    desc: "Hỏi bài theo bản đồ sao — tối đa 2 người (sao đôi).",
    to: "/tarot" as const,
  },
  {
    icon: CalendarCheck,
    title: "Lịch hẹn của tôi",
    desc: "Theo dõi buổi xem với Reader thật.",
    to: "/bookings" as const,
  },
  {
    icon: History,
    title: "Lịch sử trải bài",
    desc: "Đọc lại những lần hỏi AI trước đây.",
    to: "/tarot-history" as const,
  },
  {
    icon: Star,
    title: "Bản đồ sao",
    desc: "Hồ sơ ngày sinh / giờ sinh của bạn.",
    to: "/profile/astrology" as const,
  },
  {
    icon: ShoppingBag,
    title: "Cửa hàng",
    desc: "Bộ bài, đá khoáng, phụ kiện trải bài.",
    to: "/shop" as const,
  },
  {
    icon: BookOpen,
    title: "Tìm Reader",
    desc: "Đặt lịch với người đọc thật theo chuyên môn.",
    to: "/readers" as const,
  },
] as const;

const WORKSPACE_HOME_LABEL: Partial<Record<HomePath, string>> = {
  "/staff": "Bàn làm việc",
  "/manager": "Khu quản lý",
  "/admin": "Khu quản trị",
};

function UserHomePage() {
  const { user } = useAuth();
  const firstName = (user?.full_name || user?.name || "bạn").split(" ")[0];
  const roleHome = homePathFor(user);
  // Staff / manager / admin vào đây qua lối phụ — nhắc họ trang chủ thật là
  // khu làm việc, tránh tưởng /home là nơi xử lý ticket hay duyệt hồ sơ.
  const workspaceHome =
    roleHome !== "/home" && roleHome !== "/" ? roleHome : null;

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {workspaceHome && (
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4 shrink-0 text-gold" />
                Đây là không gian thành viên. Trang chủ vai trò{" "}
                <RoleBadge role={user!.role} /> là{" "}
                <span className="text-foreground">
                  {WORKSPACE_HOME_LABEL[workspaceHome]}
                </span>
                .
              </p>
              <Link
                to={workspaceHome}
                className="shrink-0 rounded-full border border-gold/50 px-4 py-1.5 text-xs text-gold transition hover:bg-gold/10"
              >
                Về {WORKSPACE_HOME_LABEL[workspaceHome]}
              </Link>
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
                ✦ Không gian thành viên
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl">
                Xin chào,{" "}
                <span className="text-gradient-gold">{firstName}</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Trải bài, đặt lịch Reader, hoặc chỉnh bản đồ sao — tất cả từ
                đây. Muốn xem lại trang giới thiệu sản phẩm?{" "}
                <Link
                  to="/"
                  className="text-gold underline-offset-4 hover:underline"
                >
                  Mở trang giới thiệu
                </Link>
                .
              </p>
            </div>
            <Link
              to="/tarot"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Trải bài ngay
            </Link>
          </div>
        </Reveal>

        {/* Dữ liệu thật của chính người đang đăng nhập. Đặt trên lá bài ngày
            vì đây là thứ họ vào đây để xem: buổi xem sắp tới, lần hỏi bài gần
            đây, và lá số đang được AI dùng. */}
        <div className="mt-8">
          <MemberSnapshot />
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <DailyCardDraw />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="glass rounded-2xl p-5 sm:p-6">
              <h2 className="font-display text-xl text-gradient-gold">
                Lối tắt
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Việc bạn hay làm với tư cách thành viên.
              </p>
              <ul className="mt-4 space-y-2">
                {QUICK_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-gold/30 hover:bg-gold/5"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10">
                        <item.icon className="h-4 w-4 text-gold" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gold opacity-0 transition group-hover:opacity-100" />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.desc}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
