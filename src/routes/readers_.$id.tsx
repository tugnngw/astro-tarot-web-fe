// Hồ sơ Reader và màn đặt lịch — nơi trụ cột 2 thực sự chạm được.
//
// Bản trước của trang này dựng trên mock-data.ts và một booking-store giả lưu
// trong bộ nhớ trình duyệt: đặt lịch xong tải lại trang là mất, và Reader
// không bao giờ nhìn thấy gì. Nay nối thẳng vào /api/v1/bookings.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Clock,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useReader } from "@/features/readers/queries";
import {
  useCreateBooking,
  useReaderReviews,
  useSlots,
  useNextAvailableDate,
} from "@/features/booking/queries";
import { DURATIONS, type Duration, type Slot } from "@/api/booking";
import { formatVND } from "@/lib/mock-data";

import {
  PagedList,
  Pagination,
  useCoTrangVuaManHinh,
} from "@/components/Pagination";
import { ViDateInput } from "@/components/ViDateInput";
export const Route = createFileRoute("/readers_/$id")({
  head: () => ({ meta: [{ title: "Hồ sơ Reader — ASTROTAROT" }] }),
  component: ReaderProfilePage,
});

/** Cho đặt trước tối đa hai tuần — xa hơn thì lịch Reader còn đổi nhiều. */
const DAYS_AHEAD = 14;

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

  const [duration, setDuration] = useState<Duration>(30);
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [picked, setPicked] = useState<Slot | null>(null);

  // Khung đã qua giờ bị loại, nên mở trang vào buổi tối là hôm nay trống trơn
  // và Reader trông như không nhận khách — dù mai vẫn còn chỗ. Hỏi BE ngày
  // trống gần nhất rồi nhảy thẳng tới đó, một lần, ngay khi mở trang.
  const nextDay = useNextAvailableDate(id, duration, reader.isSuccess);
  const [jumped, setJumped] = useState(false);
  useEffect(() => {
    if (jumped || !nextDay.data) return;
    if (nextDay.data !== date) setDate(nextDay.data);
    setJumped(true);
  }, [nextDay.data, jumped, date]);

  const slots = useSlots(id, date, duration, reader.isSuccess);
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
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            setDuration(d);
                            setPicked(null);
                          }}
                          aria-pressed={duration === d}
                          title={
                            unavailable
                              ? "Reader chưa đặt giá cho mốc này"
                              : undefined
                          }
                          className={
                            duration === d
                              ? "flex-1 rounded-full border border-gold bg-gold/20 py-1.5 text-xs text-gold"
                              : "flex-1 rounded-full border border-mystic/50 py-1.5 text-xs text-foreground/80 transition hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-30"
                          }
                        >
                          {d}p
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="mt-4 block">
                  <span className="text-xs text-muted-foreground">Ngày</span>
                  <ViDateInput
                    aria-label="Ngày đặt lịch"
                    value={date}
                    min={toDateInput(new Date())}
                    max={toDateInput(
                      new Date(Date.now() + DAYS_AHEAD * 86400000),
                    )}
                    onChange={(next) => {
                      setDate(next);
                      setPicked(null);
                    }}
                    className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none"
                  />
                </label>

                <div
                  className="mt-4"
                  aria-live="polite"
                  aria-busy={slots.isFetching}
                >
                  <p className="text-xs text-muted-foreground">
                    Khung giờ còn trống
                  </p>
                  {slots.isPending ? (
                    <div
                      className="mt-2 grid grid-cols-3 gap-2"
                      aria-hidden="true"
                    >
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          key={i}
                          className="h-8 animate-pulse rounded-lg bg-mystic/10"
                        />
                      ))}
                    </div>
                  ) : slots.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {slots.error instanceof Error
                        ? slots.error.message
                        : "Không tải được khung giờ"}
                    </p>
                  ) : (slots.data?.length ?? 0) === 0 ? (
                    <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                      <Clock
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <div>
                        <p>
                          {date === toDateInput(new Date())
                            ? "Hôm nay đã qua giờ làm việc của Reader."
                            : "Ngày này Reader không còn khung nào trống."}
                        </p>
                        {nextDay.data && nextDay.data !== date ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDate(nextDay.data as string);
                              setPicked(null);
                            }}
                            className="mt-1 text-gold underline-offset-4 hover:underline"
                          >
                            Xem ngày trống gần nhất (
                            {formatDayLabel(nextDay.data)})
                          </button>
                        ) : (
                          <p className="mt-1">
                            {nextDay.isPending
                              ? "Đang tìm ngày trống gần nhất…"
                              : "Reader này chưa có khung trống trong hai tuần tới."}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
                      {slots.data!.map((s) => (
                        <button
                          key={s.startTime}
                          type="button"
                          onClick={() => setPicked(s)}
                          aria-pressed={picked?.startTime === s.startTime}
                          className={
                            picked?.startTime === s.startTime
                              ? "rounded-lg border border-gold bg-gold/20 py-1.5 text-xs text-gold"
                              : "rounded-lg border border-mystic/50 py-1.5 text-xs text-foreground/80 transition hover:border-gold/60"
                          }
                        >
                          {formatTime(s.startTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {picked && (
                  <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm">
                    <p>
                      {formatDayTime(picked.startTime)} –{" "}
                      {formatTime(picked.endTime)}
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
                  className="mt-4 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
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

/** yyyy-mm-dd theo giờ ĐỊA PHƯƠNG. toISOString() sẽ lệch một ngày với múi giờ VN. */
/** "2026-10-09" → "Thứ 6, 09/10". Dùng cho nút nhảy tới ngày trống. */
function formatDayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatTime(iso: string) {
  return TIME_FORMAT.format(new Date(iso));
}
function formatDayTime(iso: string) {
  return DAY_TIME_FORMAT.format(new Date(iso));
}
function formatDate(iso: string) {
  return DATE_FORMAT.format(new Date(iso));
}
