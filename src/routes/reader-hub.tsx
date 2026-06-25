import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/reader-hub")({
  head: () => ({
    meta: [
      { title: "Reader Hub — Dashboard chuyên gia" },
      {
        name: "description",
        content: "Bảng điều khiển dành cho Reader: lịch hẹn, giá, ký quỹ.",
      },
    ],
  }),
  component: ReaderHub,
});

const TABS = ["Dashboard", "Lịch hẹn", "Quản lý giá", "Ký quỹ"] as const;
type Tab = (typeof TABS)[number];

const BOOKINGS = [
  {
    date: "28/10",
    client: "Minh Quân",
    time: "10:00",
    status: "pending" as const,
    amount: 1000000,
  },
  {
    date: "27/10",
    client: "Lan Hương",
    time: "14:30",
    status: "confirmed" as const,
    amount: 750000,
  },
  {
    date: "27/10",
    client: "Đức Anh",
    time: "20:00",
    status: "done" as const,
    amount: 1500000,
  },
  {
    date: "26/10",
    client: "Thu Trang",
    time: "19:00",
    status: "confirmed" as const,
    amount: 500000,
  },
];

function ReaderHub() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [price, setPrice] = useState(150000);

  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={40} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">
              Reader <span className="text-gradient-gold">Hub</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chào mừng trở lại, Mystic Selene ✦
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Gói Pro · <span className="text-gold">100,000 ₫</span>/tháng
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-full border border-border bg-card/50 p-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm transition ${
                tab === t
                  ? "bg-gold text-primary-foreground glow-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {tab === "Dashboard" && (
            <div className="grid gap-6 md:grid-cols-3">
              <Stat
                label="Doanh thu hôm nay"
                value={formatVND(2250000)}
                hint="3 buổi đã hoàn tất"
                highlight
              />
              <Stat label="Buổi sắp tới" value="4" hint="Trong 24h tới" />
              <Stat
                label="Đánh giá trung bình"
                value="4.9 ★"
                hint="168 đánh giá"
              />
              <div className="md:col-span-3 glass rounded-2xl p-6">
                <h3 className="font-display text-xl text-gold-soft">
                  Hoạt động gần đây
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex justify-between border-b border-border/50 pb-3">
                    <span>✨ Hoàn tất buổi với Đức Anh</span>
                    <span className="text-success">+ {formatVND(1500000)}</span>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-3">
                    <span>📅 Lịch mới từ Minh Quân</span>
                    <span className="text-muted-foreground">10:00 mai</span>
                  </li>
                  <li className="flex justify-between">
                    <span>⭐ Đánh giá 5 sao từ Lan Hương</span>
                    <span className="text-gold">"Tuyệt vời!"</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === "Lịch hẹn" && (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Ngày</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Giờ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {BOOKINGS.map((b, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-6 py-4">{b.date}</td>
                      <td className="px-6 py-4 text-foreground">{b.client}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {b.time}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-gold">
                        {formatVND(b.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Quản lý giá" && (
            <div className="glass mx-auto max-w-2xl rounded-2xl p-8">
              <h3 className="font-display text-xl text-gold-soft">
                Giá mỗi 15 phút
              </h3>
              <div className="mt-6 text-center">
                <div className="font-display text-5xl text-gradient-gold">
                  {formatVND(price)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ≈ {formatVND(price * 4)} / giờ
                </div>
              </div>
              <input
                type="range"
                min={50000}
                max={500000}
                step={10000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-8 w-full accent-[oklch(0.78_0.13_85)]"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>50,000 ₫</span>
                <span>500,000 ₫</span>
              </div>
              <div className="mt-8 rounded-lg border border-border bg-card/50 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí Pro Subscription</span>
                  <span>{formatVND(100000)} / tháng</span>
                </div>
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Phí nền tảng</span>
                  <span>15% / giao dịch</span>
                </div>
              </div>
              <button className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]">
                Lưu thay đổi
              </button>
            </div>
          )}

          {tab === "Ký quỹ" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Số dư khả dụng
                </div>
                <div className="mt-3 font-display text-4xl text-gradient-gold">
                  {formatVND(15000000)}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Đã sẵn sàng rút về ngân hàng
                </div>
                <button className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]">
                  Yêu cầu rút tiền
                </button>
              </div>
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Đang tạm giữ (Escrow)
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 font-display text-4xl text-foreground">
                  <span>🔒</span>
                  {formatVND(2500000)}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Chờ khách hoàn tất buổi xem bài
                </div>
                <div className="mt-6">
                  <div className="h-2 overflow-hidden rounded-full bg-card">
                    <div className="h-full w-[65%] bg-gold" />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    65% sẽ được giải ngân trong 48h
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div className={`glass rounded-2xl p-6 ${highlight ? "glow-gold" : ""}`}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-3 font-display text-3xl ${highlight ? "text-gradient-gold" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "confirmed" | "done" }) {
  const map = {
    pending: {
      label: "Chờ xem bài",
      cls: "border-warning/50 bg-warning/10 text-warning",
    },
    confirmed: {
      label: "Đã xác nhận",
      cls: "border-success/50 bg-success/10 text-success",
    },
    done: {
      label: "Đã hoàn tất",
      cls: "border-border bg-card text-muted-foreground",
    },
  };
  const s = map[status];
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${s.cls}`}>
      {s.label}
    </span>
  );
}
