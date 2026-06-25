// Trang Admin — chỉ role ADMIN mới được vào (bảo vệ qua <RoleGuard />).
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Settings,
  Search,
  Ban,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { RoleGuard } from "@/components/RoleGuard";
import { useBookings } from "@/lib/use-booking-store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — ASTROTAROT" }] }),
  // Bọc trong RoleGuard để chặn user/reader vào nhầm trang
  component: () => (
    <RoleGuard allow={["admin"]}>
      <AdminPage />
    </RoleGuard>
  ),
});

const MOCK_USERS = [
  {
    id: "u1",
    name: "Nguyễn An",
    email: "an@example.com",
    role: "user",
    status: "active",
    joined: "2025-12-01",
  },
  {
    id: "u2",
    name: "Mystic Selene",
    email: "reader@astro.vn",
    role: "reader",
    status: "active",
    joined: "2025-09-12",
  },
  {
    id: "u3",
    name: "Trần Bảo",
    email: "bao@example.com",
    role: "user",
    status: "active",
    joined: "2026-01-05",
  },
  {
    id: "u4",
    name: "Astra Vega",
    email: "reader2@astro.vn",
    role: "reader",
    status: "pending",
    joined: "2026-02-18",
  },
  {
    id: "u5",
    name: "Lê Mai",
    email: "mai@example.com",
    role: "user",
    status: "banned",
    joined: "2025-11-22",
  },
];
const MOCK_BOOKINGS = [
  {
    id: "b1",
    user: "Nguyễn An",
    reader: "Mystic Selene",
    date: "2026-06-09 20:00",
    amount: 150000,
    status: "confirmed",
  },
  {
    id: "b2",
    user: "Trần Bảo",
    reader: "Astra Vega",
    date: "2026-06-10 14:30",
    amount: 200000,
    status: "pending",
  },
  {
    id: "b3",
    user: "Lê Mai",
    reader: "Mystic Selene",
    date: "2026-06-08 19:00",
    amount: 150000,
    status: "done",
  },
];
const MOCK_TX = [
  {
    id: "t1",
    user: "Nguyễn An",
    type: "Nạp ví",
    amount: 500000,
    ts: "2026-06-08 10:12",
  },
  {
    id: "t2",
    user: "Trần Bảo",
    type: "Booking",
    amount: -200000,
    ts: "2026-06-07 21:30",
  },
  {
    id: "t3",
    user: "Mystic Selene",
    type: "Rút thu nhập",
    amount: -120000,
    ts: "2026-06-06 09:00",
  },
];

function AdminPage() {
  // RoleGuard đã đảm bảo chỉ admin vào được — không cần check role lại ở đây.
  const [tab, setTab] = useState<
    "overview" | "users" | "bookings" | "tx" | "settings"
  >("overview");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(MOCK_USERS);

  // Lọc danh sách user theo tên/email (search box ở tab Users)
  const filtered = useMemo(
    () =>
      users.filter((u) =>
        (u.name + u.email).toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={40} />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-gradient-gold">
              Admin Console
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản trị hệ thống ASTROTAROT
            </p>
          </div>
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs uppercase tracking-wider text-gold">
            Admin
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={Users}
            label="Tài khoản"
            value={users.length.toString()}
          />
          <Stat icon={Calendar} label="Booking hôm nay" value="12" />
          <Stat icon={DollarSign} label="Doanh thu 30d" value="48.2M ₫" />
          <Stat icon={TrendingUp} label="Reader hoạt động" value="8" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-gold/20">
          {[
            { k: "overview", l: "Tổng quan" },
            { k: "users", l: "Tài khoản" },
            { k: "bookings", l: "Booking" },
            { k: "tx", l: "Giao dịch" },
            { k: "settings", l: "Thông số web" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`px-4 py-2 text-sm transition ${
                tab === t.k
                  ? "border-b-2 border-gold text-gold"
                  : "text-muted-foreground hover:text-gold"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <div className="glass rounded-xl p-6">
              <h2 className="font-display text-xl text-gold-soft">
                Hoạt động gần đây
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>✦ 4 reader mới đăng ký chờ duyệt.</li>
                <li>✦ 23 booking hoàn tất tuần này.</li>
                <li>✦ Tổng nạp ví: 12.4M ₫ trong 7 ngày.</li>
              </ul>
            </div>
          )}

          {tab === "users" && (
            <div className="glass rounded-xl p-4">
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-gold/30 bg-input/50 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên/email…"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-2">Tên</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Trạng thái</th>
                      <th>Tham gia</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t border-border/40">
                        <td className="p-2">{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                            {u.role}
                          </span>
                        </td>
                        <td
                          className={
                            u.status === "banned"
                              ? "text-destructive"
                              : u.status === "pending"
                                ? "text-yellow-400"
                                : "text-emerald-400"
                          }
                        >
                          {u.status}
                        </td>
                        <td className="text-muted-foreground">{u.joined}</td>
                        <td className="text-right">
                          <button
                            onClick={() =>
                              setUsers((arr) =>
                                arr.map((x) =>
                                  x.id === u.id
                                    ? {
                                        ...x,
                                        status:
                                          x.status === "banned"
                                            ? "active"
                                            : "banned",
                                      }
                                    : x,
                                ),
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-gold/30 px-3 py-1 text-xs hover:bg-gold/10"
                          >
                            {u.status === "banned" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Khôi phục
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" /> Khoá
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "bookings" && <BookingsTab />}

          {tab === "tx" && (
            <div className="glass overflow-x-auto rounded-xl p-4">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-2">Người dùng</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TX.map((t) => (
                    <tr key={t.id} className="border-t border-border/40">
                      <td className="p-2">{t.user}</td>
                      <td>{t.type}</td>
                      <td
                        className={
                          t.amount < 0 ? "text-destructive" : "text-emerald-400"
                        }
                      >
                        {t.amount.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="text-muted-foreground">{t.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "settings" && (
            <div className="glass rounded-xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-gold-soft">
                <Settings className="h-5 w-5" /> Thông số web
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Setting label="Phí hoa hồng (%)" value="15" />
                <Setting label="Số tiền tối thiểu nạp ví (₫)" value="50000" />
                <Setting label="Thời gian giữ Escrow (giờ)" value="48" />
                <Setting label="Email hỗ trợ" value="support@astrotarot.vn" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingsTab() {
  const live = useBookings();
  const rows = live.length
    ? live.map((b) => ({
        id: b.id,
        user: b.userName,
        reader: b.readerName,
        date: new Date(b.createdAt).toLocaleString("vi-VN"),
        amount: b.amount,
        status: b.status,
      }))
    : MOCK_BOOKINGS;
  const color = (s: string) =>
    s === "done"
      ? "text-emerald-400"
      : s === "pending"
        ? "text-yellow-400"
        : s === "cancelled"
          ? "text-destructive"
          : "text-sky-400";
  return (
    <div className="glass overflow-x-auto rounded-xl p-4">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-2">User</th>
            <th>Reader</th>
            <th>Thời gian</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-t border-border/40">
              <td className="p-2">{b.user}</td>
              <td>{b.reader}</td>
              <td className="text-muted-foreground">{b.date}</td>
              <td className="text-gold">
                {b.amount.toLocaleString("vi-VN")} ₫
              </td>
              <td className={color(b.status)}>{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl text-gradient-gold">
        {value}
      </div>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        defaultValue={value}
        className="w-full rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}
