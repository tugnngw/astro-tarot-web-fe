import { useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/lib/auth-context";

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
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

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
          {aside}
        </div>

        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label="Khu vực làm việc"
            className="mt-6 flex flex-wrap gap-2 border-b border-gold/15 pb-3"
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
                  className={`rounded-full border px-4 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:ring-gold/40 ${
                    isActive
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-mystic/50 bg-mystic/10 text-foreground/80 hover:border-gold/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">{current?.render()}</div>
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
