import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  User as UserIcon,
  BookMarked,
  Bell,
  Settings,
  LogOut,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LogoutConfirm } from "./LogoutConfirm";
import logo from "@/assets/logo-astrotarot.png";

export function Header() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="ASTROTAROT"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-gold/40"
            />
            <span className="font-display text-xl font-semibold tracking-[0.18em]">
              <span className="text-gradient-gold">ASTROTAROT</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link
              to="/"
              className="text-muted-foreground transition hover:text-gold"
            >
              Trang chủ
            </Link>
            <Link
              to="/tarot"
              className="text-muted-foreground transition hover:text-gold"
            >
              Tarot AI
            </Link>
            <Link
              to="/readers"
              className="text-muted-foreground transition hover:text-gold"
            >
              Reader
            </Link>
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

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-3 py-1.5 text-sm transition hover:border-gold"
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
                  className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
