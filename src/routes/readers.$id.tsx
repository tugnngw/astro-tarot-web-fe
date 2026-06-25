import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar as CalIcon,
  Star,
  Heart,
  MessageCircle,
  Play,
  Facebook,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { READERS, formatVND } from "@/lib/mock-data";
import { useSlots, useBookings } from "@/lib/use-booking-store";
import {
  createBooking,
  updateBookingStatus,
  isSlotBooked,
} from "@/lib/booking-store";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/readers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Hồ sơ Reader — ASTROTAROT` },
      { name: "description", content: `Đặt lịch với Reader ${params.id}` },
    ],
  }),
  component: ReaderProfilePage,
});

function ReaderProfilePage() {
  const { id } = Route.useParams();
  const reader = READERS.find((r) => r.id === id);
  const navigate = useNavigate();
  const { user, requestAuth } = useAuth();
  const slots = useSlots(id);
  useBookings(); // re-render on changes
  const [tab, setTab] = useState<"game" | "donate" | "posts" | "story">("game");
  const [picked, setPicked] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof slots>();
    slots.forEach((s) => {
      if (!m.has(s.date)) m.set(s.date, []);
      m.get(s.date)!.push(s);
    });
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  if (!reader) {
    return (
      <div className="relative min-h-screen">
        <Header />
        <StarField count={30} />
        <div className="mx-auto max-w-3xl p-10 text-center">
          <h1 className="font-display text-2xl">Không tìm thấy Reader</h1>
          <button
            onClick={() => navigate({ to: "/readers" })}
            className="mt-4 rounded-full bg-gold px-5 py-2 text-sm text-primary-foreground"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const book = (slotId: string) => {
    requestAuth(() => {
      if (isSlotBooked(slotId)) return toast.error("Khung giờ đã có người đặt");
      setPicked(slotId);
      setPaying(true);
    });
  };

  const confirmPay = (method: "vnpay" | "momo") => {
    if (!picked || !user) return;
    const slot = slots.find((s) => s.id === picked);
    if (!slot) return;
    const b = createBooking({
      slotId: picked,
      readerId: reader.id,
      readerName: reader.name,
      userId: user.id,
      userName: user.name,
      amount: reader.pricePer15m,
    });
    setTimeout(() => updateBookingStatus(b.id, "paid", method), 600);
    toast.success(
      `Đã đặt lịch ${slot.date} ${slot.time} qua ${method.toUpperCase()}`,
    );
    setPaying(false);
    setPicked(null);
  };

  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={30} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-mystic/40 via-card/60 to-mystic/40 p-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-card text-4xl glow-gold">
                {reader.avatar}
              </div>
              <div>
                <h1 className="flex items-center gap-2 font-display text-2xl text-foreground">
                  {reader.name}
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    HOT
                  </span>
                </h1>
                <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground">
                  ID{" "}
                  <span className="text-gold">{reader.id.toUpperCase()}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {reader.title}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <Stat n="8" l="Theo dõi" />
              <Stat n="150" l="Người hâm mộ" />
              <Stat n="1.6K" l="Đặt đơn" />
              <Stat n="100%" l="Hoàn thành" />
              <div className="text-center">
                <div className="font-display text-lg text-gold">
                  ★ {reader.rating}
                </div>
                <div className="uppercase tracking-wider text-muted-foreground">
                  Đánh giá
                </div>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-primary-foreground glow-gold">
                  <Heart className="h-3 w-3" /> Theo dõi
                </button>
                <button className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold hover:bg-gold/10">
                  <MessageCircle className="h-3 w-3" /> Trò chuyện
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Left column */}
          <aside className="space-y-4">
            <div className="glass overflow-hidden rounded-xl">
              <div className="relative aspect-video bg-gradient-to-br from-mystic to-background">
                <div className="absolute left-2 top-2 rounded bg-gold/20 px-2 py-0.5 text-[10px] text-gold">
                  ✦ Chuyện
                </div>
                <div className="grid h-full place-items-center text-5xl text-gold/50">
                  <Sparkles />
                </div>
              </div>
              <div className="flex gap-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="aspect-video flex-1 rounded bg-gradient-to-br from-mystic/40 to-card"
                  />
                ))}
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold">
              <Heart className="h-4 w-4" /> Donate
            </button>

            <div className="glass rounded-xl p-4 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Ngày tham gia</span>
                <span>25-03-2018</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Link</span>
                <Facebook className="h-4 w-4 text-sky-400" />
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="font-display text-base text-gold-soft">
                Thông tin cá nhân
              </h3>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {reader.bio}
              </p>
            </div>
          </aside>

          {/* Right column */}
          <div className="space-y-4">
            <div className="glass rounded-xl">
              <div className="flex border-b border-border/40">
                {(
                  [
                    ["game", "Lịch & Đặt"],
                    ["donate", "Donate"],
                    ["posts", "Bài đăng"],
                    ["story", "Story"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`flex-1 py-3 text-sm transition ${tab === k ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {tab === "game" && (
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-gold/30 bg-background/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-gold/10 text-2xl">
                        {reader.avatar}
                      </div>
                      <div>
                        <div className="font-display text-base">
                          {reader.title}
                        </div>
                        <div className="text-gold">
                          💎 {formatVND(reader.pricePer15m)}{" "}
                          <span className="text-xs text-muted-foreground">
                            /15p
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mb-3 font-display text-base text-gold-soft">
                    Chọn lịch trống để Book
                  </h3>
                  <div className="space-y-4">
                    {grouped.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Reader chưa mở lịch.
                      </p>
                    )}
                    {grouped.map(([date, daySlots]) => (
                      <div key={date}>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">
                          <CalIcon className="h-3 w-3" /> {date}
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {daySlots.map((s) => {
                            const booked = isSlotBooked(s.id);
                            return (
                              <button
                                key={s.id}
                                disabled={!!booked}
                                onClick={() => book(s.id)}
                                className={`rounded-lg border px-3 py-2 text-sm transition ${booked ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground line-through" : "border-gold/40 bg-card/40 text-foreground hover:border-gold hover:bg-gold/10"}`}
                              >
                                {s.time}
                                <div
                                  className={`mt-0.5 text-[9px] uppercase ${booked ? "text-destructive" : "text-emerald-400"}`}
                                >
                                  {booked ? "Đã đặt" : "Trống"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "donate" && (
                <div className="p-6 text-sm text-muted-foreground">
                  Tính năng donate sắp ra mắt ✦
                </div>
              )}
              {tab === "posts" && (
                <div className="p-6 text-sm text-muted-foreground">
                  Reader chưa có bài đăng.
                </div>
              )}
              {tab === "story" && (
                <div className="p-6 text-sm text-muted-foreground">
                  Chưa có story nào.
                </div>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="font-display text-base text-gold-soft">
                Hình ảnh & kỹ năng
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-lg bg-gradient-to-br from-mystic/30 via-card to-background"
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Chu kỳ nhận:</span>
                {[
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                  "CN",
                ].map((d) => (
                  <span
                    key={d}
                    className="rounded bg-gold/10 px-2 py-0.5 text-gold"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Thời gian nhận:</span>
                <span className="text-foreground">00:00 – 23:59</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  Giới thiệu bằng giọng nói:
                </span>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/80 text-white">
                  <Play className="h-3 w-3" />
                </button>
                <div className="h-2 flex-1 rounded bg-gradient-to-r from-sky-400 to-gold" />
                <span className="text-muted-foreground">4″</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Chuyên môn:</span>
                {reader.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-gold/30 bg-background/40 px-2 py-0.5 text-foreground/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="flex items-center gap-2 font-display text-base text-gold-soft">
                <Star className="h-4 w-4" /> Điểm đánh giá
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                {reader.reviews} lượt đánh giá · ★ {reader.rating}
              </div>
            </div>
          </div>
        </div>
      </div>

      {paying && picked && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setPaying(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-2xl p-6 glow-gold"
          >
            <h3 className="font-display text-2xl text-gradient-gold">
              Xác nhận Book
            </h3>
            <div className="mt-4 space-y-1 text-sm">
              <Row l="Reader" v={reader.name} />
              <Row
                l="Khung giờ"
                v={(() => {
                  const s = slots.find((x) => x.id === picked);
                  return s ? `${s.date} · ${s.time}` : "—";
                })()}
              />
              <Row l="Tổng" v={formatVND(reader.pricePer15m)} hl />
            </div>
            <p className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              🔒 Tiền được ký quỹ Escrow đến khi buổi xem kết thúc.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => confirmPay("vnpay")}
                className="rounded-xl border border-border bg-card p-4 hover:border-gold"
              >
                <div className="text-2xl">💳</div>
                <div className="mt-1 text-sm font-medium">VNPay</div>
              </button>
              <button
                onClick={() => confirmPay("momo")}
                className="rounded-xl border border-border bg-card p-4 hover:border-gold"
              >
                <div className="text-2xl">📱</div>
                <div className="mt-1 text-sm font-medium">Momo</div>
              </button>
            </div>
            <button
              onClick={() => setPaying(false)}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg text-gold">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {l}
      </div>
    </div>
  );
}
function Row({ l, v, hl }: { l: string; v: string; hl?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span
        className={hl ? "text-lg font-semibold text-gold" : "text-foreground"}
      >
        {v}
      </span>
    </div>
  );
}
