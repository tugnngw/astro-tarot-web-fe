import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  User as UserIcon,
  BookMarked,
  Bell,
  Settings,
  LogOut,
  History,
  ShoppingBag,
  Package,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { LogoutConfirm } from "./LogoutConfirm";
import { ScrollProgress } from "./ScrollProgress";
import logo from "@/assets/logo-astrotarot.png";

/** Ba phần chính của sản phẩm, dùng chung cho nav desktop và menu mobile. */
const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/tarot", label: "Tarot AI" },
  { to: "/readers", label: "Reader" },
  { to: "/shop", label: "Shop" },
] as const;

export function Header() {
  const { user, openAuth } = useAuth();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const cartCount = cart?.totalQuantity ?? 0;

  // Đổi trang thì đóng cả hai menu, nếu không chúng treo lại trên trang mới.
  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
  }, [pathname]);

  // Escape đóng menu — hành vi mặc định người dùng mong đợi ở mọi overlay.
  useEffect(() => {
    if (!mobileOpen && !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, open]);

  return (
    <>
      <ScrollProgress />
      {/* Nền xanh mực đặc thay cho lớp kính trong suốt, và một đường viền
          vàng ở dưới đủ rõ để tách hẳn thanh điều hướng khỏi bầu trời sao —
          trước đây header gần như tan vào nền. */}
      <header className="site-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* min-w-0 + truncate: ở 375px, wordmark + giỏ + avatar + nút menu
              cộng lại rộng hơn màn hình và đẩy cả trang cuộn ngang. Cho phép
              phần thương hiệu co lại thay vì làm tràn layout. */}
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gold/40"
            />
            <span className="truncate font-display text-base font-semibold tracking-[0.1em] sm:text-xl sm:tracking-[0.18em]">
              <span className="text-gradient-gold">ASTROTAROT</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-muted-foreground transition hover:text-gold"
                activeProps={{ className: "text-gold" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="text-gold transition hover:underline"
              >
                Admin
              </Link>
            )}
            {user?.role === "reader" && (
              <Link
                to="/reader"
                className="text-gold transition hover:underline"
              >
                Workspace
              </Link>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Giỏ hàng: chỉ hiện khi đã đăng nhập, vì giỏ nằm ở BE theo user. */}
            {user && (
              <Link
                to="/cart"
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
                className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-card/60 transition hover:border-gold"
              >
                <ShoppingBag className="h-4 w-4 text-gold" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-2 py-1.5 text-sm transition hover:border-gold sm:px-3"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-primary-foreground">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="hidden text-foreground sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gold transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gold/30 bg-card/95 backdrop-blur shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-border/50 px-4 py-3">
                      <div className="text-sm font-medium text-foreground">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                      <span className="mt-2 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                        {user.role}
                      </span>
                    </div>
                    {[
                      {
                        ic: UserIcon,
                        l: "Hồ sơ cá nhân",
                        a: () => {
                          setOpen(false);
                          navigate({ to: "/profile" });
                        },
                      },
                      {
                        ic: Package,
                        l: "Đơn hàng của tôi",
                        a: () => {
                          setOpen(false);
                          navigate({ to: "/orders" });
                        },
                      },
                      { ic: History, l: "Lịch sử tư vấn" },
                      { ic: BookMarked, l: "Bài viết đã lưu" },
                      { ic: Bell, l: "Thông báo" },
                      { ic: Settings, l: "Cài đặt tài khoản" },
                    ].map(({ ic: Ic, l, a }) => (
                      <button
                        key={l}
                        onClick={a}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-gold/10"
                      >
                        <Ic className="h-4 w-4 text-gold" /> {l}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setOpen(false);
                        setLogoutOpen(true);
                      }}
                      className="flex w-full items-center gap-2 border-t border-border/50 px-4 py-2 text-left text-sm text-muted-foreground hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="hidden rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10 sm:inline-block"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105 sm:px-4"
                >
                  Đăng ký
                </button>
              </>
            )}

            {/* Nút mở menu trên mobile. Trước đây nav bị ẩn hẳn dưới md
                mà không có gì thay thế, nên điện thoại không điều hướng được. */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
              className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-card/60 text-gold transition hover:border-gold md:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-gold/20 px-4 py-3 md:hidden">
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-gold/10 hover:text-gold"
                  activeProps={{ className: "text-gold" }}
                  activeOptions={{ exact: l.to === "/" }}
                >
                  {l.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-gold/10 hover:text-gold"
                >
                  Đơn hàng của tôi
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-gold"
                >
                  Admin
                </Link>
              )}
              {user?.role === "reader" && (
                <Link
                  to="/reader"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-gold"
                >
                  Workspace
                </Link>
              )}
              {!user && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openAuth("login");
                  }}
                  className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm text-gold transition hover:bg-gold/10"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </nav>
        )}
      </header>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
