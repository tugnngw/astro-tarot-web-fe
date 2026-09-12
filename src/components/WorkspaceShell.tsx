import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/lib/auth-context";
import { homePathFor } from "@/lib/roles";

export interface WorkspaceTab {
  key: string;
  label: string;
  /** Nội dung dựng lười: chỉ tab đang mở mới render, đỡ gọi API thừa. */
  render: () => ReactNode;
}

/**
 * Khung chung cho ba khu vực làm việc (/staff, /manager, /admin).
 *
 * Ba trang này khác nhau ở nội dung chứ không khác ở cách bày biện, nên gom
 * phần khung lại: cùng một cách đặt tiêu đề, cùng một kiểu tab, cùng một chỗ
 * hiện vai trò. Người được nâng từ nhân viên lên quản lý không phải học lại
 * giao diện.
 */
export function WorkspaceShell({
  title,
  subtitle,
  tabs,
  aside,
}: {
  title: string;
  subtitle: string;
  tabs: WorkspaceTab[];
  /** Nội dung phụ bên phải tiêu đề, ví dụ nút thao tác nhanh. */
  aside?: ReactNode;
}) {
  const { user } = useAuth();
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  // Tab bị ẩn vì thiếu quyền → nhảy về tab còn lại, đừng giữ key đã biến mất.
  useEffect(() => {
    if (!tabs.some((t) => t.key === active)) {
      setActive(tabs[0]?.key ?? "");
    }
  }, [tabs, active]);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  // Staff / manager / admin vẫn có USER_BASIC — họ có thể cần trải bài hoặc
  // xem lịch cá nhân. "Trang chủ" của họ là khu làm việc, nên mở lối phụ sang
  // hub thành viên thay vì bắt họ gõ URL.
  const showMemberLink = user != null && homePathFor(user) !== "/home";

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
              {user && <RoleBadge role={user.role} />}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showMemberLink && (
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2 text-xs text-gold transition hover:bg-gold/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Không gian thành viên
              </Link>
            )}
            {aside}
          </div>
        </div>

        {/*
         * Điều hướng dọc bên trái. Trước đây là một hàng pill ngang chạy hết
         * chiều rộng; với tám mục của trang Quản trị thì hàng đó tràn xuống hai
         * dòng và khó quét mắt. Cột dọc đọc theo chiều tự nhiên hơn và chừa chỗ
         * cho nội dung rộng bên phải.
         *
         * Trên màn hẹp cột dọc sẽ ăn hết bề ngang, nên ở đó nó thu lại thành
         * một hàng pill cuộn ngang (lg: mới chuyển sang cột).
         */}
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-8">
          {tabs.length > 1 && (
            <nav
              role="tablist"
              aria-label="Khu vực làm việc"
              aria-orientation="vertical"
              className="-mx-1 flex flex-row gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 lg:sticky lg:top-24 lg:self-start"
            >
              {tabs.map((tab) => {
                const isActive = tab.key === current?.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(tab.key)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 lg:w-full ${
                      isActive
                        ? "bg-gold font-medium text-background shadow-sm"
                        : "text-foreground/70 hover:bg-mystic/15 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          <div className="min-w-0 flex-1">{current?.render()}</div>
        </div>
      </main>
    </div>
  );
}

/**
 * Ô báo "phần này chưa có API".
 *
 * Thà nói thẳng còn hơn bày số liệu bịa: một bảng doanh thu giả trông rất
 * thuyết phục, và người dùng sẽ ra quyết định dựa trên nó.
 */
export function NotWiredYet({
  title,
  what,
  missing,
}: {
  title: string;
  what: string;
  missing: string;
}) {
  return (
    <section className="glass rounded-2xl border border-dashed border-gold/25 px-5 py-6">
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{what}</p>
      <p className="mt-3 text-xs text-muted-foreground/80">
        <span className="text-gold/80">Chưa nối được:</span> {missing}
      </p>
    </section>
  );
}
