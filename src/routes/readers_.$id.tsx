// Hồ sơ Reader và màn đặt lịch — nơi trụ cột 2 thực sự chạm được.
//
// Bản trước của trang này dựng trên mock-data.ts và một booking-store giả lưu
// trong bộ nhớ trình duyệt: đặt lịch xong tải lại trang là mất, và Reader
// không bao giờ nhìn thấy gì. Nay nối thẳng vào /api/v1/bookings.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AlertCircle, ArrowLeft, CalendarClock, Star } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useReader } from "@/features/readers/queries";
import {
  useCreateBooking,
  useMonthCalendar,
  useReaderReviews,
} from "@/features/booking/queries";
import {
  DURATIONS,
  type CalendarDay,
  type CalendarSlot,
  type Duration,
} from "@/api/booking";
import { formatVND } from "@/lib/mock-data";
import {
  ChuThichDat,
  DieuHuongThang,
  LuoiNgay,
  gioVn,
  homNayVn,
  loiNgay,
  thangDatHopLe,
} from "@/features/booking/components/LichThang";

import {
  PagedList,
  Pagination,
  useCoTrangVuaManHinh,
} from "@/components/Pagination";
export const Route = createFileRoute("/readers_/$id")({
  head: () => ({ meta: [{ title: "Hồ sơ Reader — ASTROTAROT" }] }),
  component: ReaderProfilePage,
});

function ReaderProfilePage() {
  const { id } = Route.useParams();
  const { user, requestAuth } = useAuth();

  const reader = useReader(id);
  const [trangDanhGia, setTrangDanhGia] = useState(0);
  // Cỡ trang theo màn hình thật: một trang vừa một màn, khỏi cuộn
  // xuống mới bấm được sang trang.
  const listRef = useRef<HTMLDivElement>(null);
  const coTrang = useCoTrangVuaManHinh(listRef);
  const reviews = useReaderReviews(id, trangDanhGia, coTrang);

  const hom = homNayVn();
  const [duration, setDuration] = useState<Duration>(30);
  const [year, setYear] = useState(hom.year);
  const [month, setMonth] = useState(hom.month);
  const [date, setDate] = useState(hom.iso);
  const [picked, setPicked] = useState<CalendarSlot | null>(null);

  const lich = useMonthCalendar(id, year, month, duration, reader.isSuccess);
  const create = useCreateBooking();

  // Reader của chính mình thì không đặt lịch được — BE chặn, nên giao diện cũng
  // phải nói trước thay vì để bấm rồi nhận lỗi.
  const isSelf = Boolean(
    user && reader.data?.userId && user.id === reader.data.userId,
  );

  function book() {
    if (!picked) return;
    const slot = picked;

    // requestAuth giữ lại việc đang làm dở: chưa đăng nhập thì nó mở hộp đăng
    // nhập rồi TỰ chạy tiếp hàm này sau khi đăng nhập xong. Nếu chỉ gọi
    // openAuth thì người dùng quay lại với khung giờ đã chọn bị mất và phải dò
    // lại từ đầu — đúng lúc họ vừa quyết định trả tiền.
    requestAuth(async () => {
      try {
        await create.mutateAsync({
          readerProfileId: id,
          startTime: slot.startTime,
          durationMinutes: duration,
        });
        toast.success("Đã gửi yêu cầu. Reader sẽ xác nhận trong ít phút.");
        setPicked(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không đặt được lịch");
      }
    });
  }

  if (reader.isPending) {
    return (
      <Shell>
        <div
          className="glass h-64 animate-pulse rounded-2xl"
          aria-busy="true"
        />
      </Shell>
    );
  }

  if (reader.isError || !reader.data) {
    return (
      <Shell>
        <div className="glass flex flex-col items-center rounded-2xl px-6 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive/70" />
          <h1 className="mt-4 font-display text-2xl">Không tìm thấy Reader</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hồ sơ này có thể đã ngừng hoạt động hoặc đường dẫn không đúng.
          </p>
          <Link
            to="/readers"
            className="mt-5 rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground glow-gold"
          >
            Xem Reader khác
          </Link>
        </div>
      </Shell>
    );
  }

  const r = reader.data;
  const name = r.fullName ?? `@${r.username}`;
  const specialties = r.specialties ?? [];
  const price = priceFor(r, duration);

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Hồ sơ */}
        <div className="space-y-5">
          <section className="glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              {r.avatar ? (
                <img
                  src={r.avatar}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-gold/40"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-gold bg-card font-display text-3xl text-gold"
                >
                  {name.charAt(name.startsWith("@") ? 1 : 0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-3xl leading-tight">{name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.yearsExperience
                    ? `${r.yearsExperience} năm kinh nghiệm`
                    : "Reader mới"}
                  {" · "}
                  {r.isAvailable === false ? (
                    <span className="text-amber-300">tạm ngưng nhận lịch</span>
                  ) : (
                    <span className="text-emerald-300">đang nhận lịch</span>
                  )}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm">
                  <Star
                    aria-hidden="true"
                    className="h-4 w-4 fill-gold text-gold"
                  />
                  <span className="text-gold">
                    {r.totalReviews
                      ? Number(r.rating ?? 0).toFixed(1)
                      : "Chưa có đánh giá"}
                  </span>
                  {Boolean(r.totalReviews) && (
                    <span className="text-muted-foreground">
                      ({r.totalReviews} lượt)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {r.bio && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {r.bio}
              </p>
            )}

            {specialties.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-gold/25 px-3 py-1 text-xs text-gold/80"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {DURATIONS.map((d) => (
                <div
                  key={d}
                  className="rounded-xl border border-gold/20 px-3 py-2"
                >
                  <dt className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    {d} phút
                  </dt>
                  <dd className="mt-1 font-display text-lg text-gold">
                    {priceFor(r, d) != null
                      ? formatVND(priceFor(r, d)!)
                      : "Chưa đặt giá"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Đánh giá thật, khoá theo buổi xem đã hoàn tất */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl">Đánh giá từ khách</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Chỉ người đã thực sự đặt và hoàn tất buổi xem mới viết được — mỗi
              buổi một lần.
            </p>

            <div className="mt-4">
              {reviews.isPending ? (
                <div className="space-y-2" aria-busy="true">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl bg-mystic/10"
                    />
                  ))}
                </div>
              ) : (reviews.data?.content.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Chưa có đánh giá nào. Bạn có thể là người đầu tiên.
                </p>
              ) : (
                <PagedList pageSize={coTrang} listRef={listRef}>
                  <ul className="space-y-3">
                    {reviews.data!.content.map((rv) => (
                      <li
                        key={rv.id}
                        className="rounded-xl border border-gold/15 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground">
                            {rv.authorName}
                          </span>
                          <span
                            className="flex shrink-0 items-center gap-0.5"
                            aria-label={`${rv.rating} sao`}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                aria-hidden="true"
                                className={`h-3.5 w-3.5 ${
                                  n <= rv.rating
                                    ? "fill-gold text-gold"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </span>
                        </div>
                        {rv.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {rv.comment}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-muted-foreground/70">
                          {formatDate(rv.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </PagedList>
              )}

              {!reviews.isPending && (
                <Pagination
                  page={trangDanhGia}
                  totalPages={reviews.data?.totalPages ?? 1}
                  totalElements={reviews.data?.totalElements ?? 0}
                  onChange={setTrangDanhGia}
                  pageSize={coTrang}
                  busy={reviews.isFetching}
                  unit="đánh giá"
                />
              )}
            </div>
          </section>
        </div>

        {/* Đặt lịch */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="glass rounded-2xl p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <CalendarClock aria-hidden="true" className="h-5 w-5 text-gold" />
              Đặt lịch
            </h2>

            {isSelf ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Đây là hồ sơ Reader của chính bạn. Lịch hẹn khách đặt nằm ở{" "}
                <Link to="/staff" className="text-gold hover:underline">
                  bàn làm việc
                </Link>
                .
              </p>
            ) : r.isAvailable === false ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Reader đang tạm ngưng nhận lịch. Bạn có thể quay lại sau hoặc
                chọn Reader khác.
              </p>
            ) : (
              <>
                <fieldset className="mt-4">
                  <legend className="text-xs text-muted-foreground">
                    Thời lượng
                  </legend>
                  <div className="mt-2 flex gap-2">
                    {DURATIONS.map((d) => {
                      const unavailable = priceFor(r, d) == null;
                      const chon = duration === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            setDuration(d);
                            setPicked(null);
                          }}
                          aria-pressed={chon}
                          title={
                            unavailable
                              ? "Reader chưa đặt giá cho mốc này"
                              : undefined
                          }
                          className={`flex-1 rounded-full border py-1.5 text-xs transition hover:border-gold/70 hover:bg-gold/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                            chon
                              ? "border-gold bg-gold/20 text-gold"
                              : "border-mystic/50 text-foreground/80"
                          }`}
                        >
                          {d}p
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div
                  className="mt-4"
                  aria-live="polite"
                  aria-busy={lich.isFetching}
                >
                  <DieuHuongThang
                    year={year}
                    month={month}
                    coTruoc={thangDatHopLe(
                      month === 1 ? year - 1 : year,
                      month === 1 ? 12 : month - 1,
                    )}
                    coSau={thangDatHopLe(
                      month === 12 ? year + 1 : year,
                      month === 12 ? 1 : month + 1,
                    )}
                    onMove={(delta) => {
                      const base = year * 12 + (month - 1) + delta;
                      const y = Math.floor(base / 12);
                      const m = (base % 12) + 1;
                      if (!thangDatHopLe(y, m)) return;
                      setYear(y);
                      setMonth(m);
                      setPicked(null);
                      const so = new Date(y, m, 0).getDate();
                      const ngay = Math.min(Number(date.slice(8)), so);
                      const iso = `${y}-${String(m).padStart(2, "0")}-${String(ngay).padStart(2, "0")}`;
                      const h = homNayVn();
                      setDate(
                        y === h.year && m === h.month && iso < h.iso
                          ? h.iso
                          : iso,
                      );
                    }}
                  />
                  {lich.isPending ? (
                    <div
                      className="mt-2 h-64 animate-pulse rounded-xl bg-mystic/10"
                      aria-hidden="true"
                    />
                  ) : lich.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {lich.error instanceof Error
                        ? lich.error.message
                        : "Không tải được lịch"}
                    </p>
                  ) : (
                    <>
                      <LuoiNgay
                        year={year}
                        month={month}
                        selected={date}
                        onSelect={(iso) => {
                          setDate(iso);
                          setPicked(null);
                        }}
                        loai={
                          new Map(
                            (lich.data?.days ?? []).map((d) => [
                              d.date,
                              d.kind,
                            ]),
                          )
                        }
                      />
                      <ChuThichDat />
                    </>
                  )}
                </div>

                <KhungGio
                  dangTai={lich.isPending}
                  loi={lich.isError}
                  ngay={lich.data?.days.find((d) => d.date === date)}
                  laHomNay={date === homNayVn().iso}
                  picked={picked}
                  onPick={setPicked}
                />

                {picked && (
                  <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm">
                    <p>
                      {date.split("-").reverse().join("/")} ·{" "}
                      {gioVn(picked.startTime)} – {gioVn(picked.endTime)}
                    </p>
                    <p className="mt-1 font-display text-xl text-gold">
                      {formatVND(picked.price)}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!picked || create.isPending || price == null}
                  onClick={book}
                  className="mt-4 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  {create.isPending
                    ? "Đang gửi…"
                    : user
                      ? "Đặt lịch"
                      : "Đăng nhập để đặt lịch"}
                </button>

                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Đặt xong sẽ ở trạng thái chờ Reader xác nhận. Bạn theo dõi và
                  huỷ được ở trang{" "}
                  <Link to="/bookings" className="text-gold hover:underline">
                    Lịch hẹn của tôi
                  </Link>
                  .
                </p>
              </>
            )}
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/readers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-gold"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Quay lại danh
          sách Reader
        </Link>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

function priceFor(
  r: {
    pricePer15m: number | null;
    pricePer30m: number | null;
    pricePer60m: number | null;
  },
  d: Duration,
) {
  return d === 15 ? r.pricePer15m : d === 30 ? r.pricePer30m : r.pricePer60m;
}

function KhungGio({
  dangTai,
  loi,
  ngay,
  laHomNay,
  picked,
  onPick,
}: {
  dangTai: boolean;
  loi: boolean;
  ngay: CalendarDay | undefined;
  laHomNay: boolean;
  picked: CalendarSlot | null;
  onPick: (s: CalendarSlot | null) => void;
}) {
  const conTrong = (ngay?.slots ?? []).some((s) => s.state === "FREE");
  return (
    <div className="mt-4">
      <p className="text-xs text-muted-foreground">Khung giờ</p>
      {dangTai ? (
        <div className="mt-2 grid grid-cols-3 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-lg bg-mystic/10"
            />
          ))}
        </div>
      ) : loi || !ngay ? null : !conTrong ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {loiNgay(ngay, laHomNay)}
        </p>
      ) : (
        <div className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
          {ngay.slots.map((s) => {
            const mo = s.state === "FREE";
            const dangChon = picked?.startTime === s.startTime;
            return (
              <button
                key={s.startTime}
                type="button"
                disabled={!mo}
                onClick={() => onPick(dangChon ? null : s)}
                aria-pressed={dangChon}
                className={`rounded-lg border py-1.5 text-xs transition active:scale-95 disabled:cursor-not-allowed ${
                  dangChon
                    ? "border-gold bg-gold/20 text-gold"
                    : mo
                      ? "border-mystic/50 text-foreground/80 hover:border-gold/60 hover:bg-gold/10"
                      : "border-mystic/30 text-muted-foreground/45"
                }`}
              >
                <span
                  className={
                    mo ? "" : "line-through decoration-muted-foreground/40"
                  }
                >
                  {gioVn(s.startTime)}
                </span>
                {!mo && (
                  <span className="mt-0.5 block text-[9px] font-normal no-underline">
                    {s.state === "TAKEN" ? "Đã kín" : "Đã qua"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(iso: string) {
  return DATE_FORMAT.format(new Date(iso));
}
