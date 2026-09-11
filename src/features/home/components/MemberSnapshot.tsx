// Ba khối dữ liệu thật của không gian thành viên.
//
// Trước đây /home chỉ có lời chào, lá bài ngày và một danh sách lối tắt tĩnh —
// không gọi API nào, nên nó không biết gì về người đang đăng nhập ngoài cái
// tên. Ba khối dưới đây ứng với ba thứ người dùng thực sự có trên hệ thống:
// buổi xem sắp tới, lần hỏi bài gần đây, và bản đồ sao của chính họ.
//
// Mọi endpoint đều đã có sẵn; không thêm gì ở backend.
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  History,
  Sparkles,
  Star,
} from "lucide-react";
import { useMyBookings } from "@/features/booking/queries";
import { useMyApplication } from "@/features/readers/queries";
import { getReadingHistory } from "@/api/tarot";
import { getPrimaryAstrologyProfile } from "@/api/astrology";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/api/booking";
import { formatVND } from "@/lib/mock-data";

/** Ngày giờ ngắn gọn: "Thứ 5, 24/09 · 09:00". */
function fmtWhen(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }) +
    " · " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MemberSnapshot() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReaderApplicationStrip />
      <UpcomingBooking />
      <RecentReadings />
      <PrimaryChart />
    </div>
  );
}

/**
 * Trạng thái đơn xin làm Reader.
 *
 * Chỉ hiện khi đang có đơn — người nộp xong hiện phải tự nhớ mà mở lại modal
 * mới biết mình đang ở đâu. Đã duyệt rồi thì thôi, vì lúc đó họ đã có khu làm
 * việc riêng và cái ô này chỉ thành thừa.
 */
function ReaderApplicationStrip() {
  const q = useMyApplication();
  const app = q.data;
  if (!app || app.status === "APPROVED") return null;

  const pending = app.status === "PENDING";
  return (
    <article
      className={`rounded-2xl border p-5 md:col-span-2 xl:col-span-3 ${
        pending ? "border-gold/30 bg-gold/5" : "border-destructive/40 bg-destructive/5"
      }`}
    >
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Star className="h-4 w-4 text-gold" />
        {pending ? "Đơn làm Reader đang chờ duyệt" : "Đơn làm Reader chưa được duyệt"}
      </h3>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {pending
          ? `Bạn gửi đơn ngày ${fmtDate(app.createdAt)}. Quản trị viên sẽ phản hồi qua thông báo trên trang.`
          : app.rejectionReason?.trim() ||
            "Không có lý do cụ thể. Bạn có thể chỉnh lại nội dung và nộp lại."}
      </p>
    </article>
  );
}

/** Buổi xem sắp tới — phần "sắp phải có mặt" của trụ cột 2. */
function UpcomingBooking() {
  const q = useMyBookings({ page: 0, size: 20 });

  // BE trả mới-nhất-trước và gộp cả buổi đã qua. Ở đây chỉ quan tâm buổi còn
  // ở phía trước và chưa bị huỷ, sắp theo thứ tự sắp diễn ra.
  const now = Date.now();
  const upcoming = (q.data?.content ?? [])
    .filter(
      (b) =>
        new Date(b.startTime).getTime() > now &&
        b.status !== "CANCELLED" &&
        b.status !== "COMPLETED",
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 2);

  return (
    <Card
      icon={CalendarCheck}
      title="Lịch hẹn sắp tới"
      to="/bookings"
      linkLabel="Tất cả lịch hẹn"
      loading={q.isPending}
    >
      {upcoming.length === 0 ? (
        <Empty text="Bạn chưa có buổi xem nào sắp tới." to="/readers" cta="Tìm Reader" />
      ) : (
        <ul className="space-y-2.5">
          {upcoming.map((b) => (
            <li key={b.id} className="rounded-xl border border-white/5 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{b.readerName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {fmtWhen(b.startTime)} · {b.durationMinutes} phút
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-xs text-gold">
                    {b.totalAmount != null ? formatVND(b.totalAmount) : ""}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {BOOKING_STATUS_LABEL[b.status as BookingStatus] ?? b.status}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Vài lần hỏi bài gần nhất — phần "xem lại" của trụ cột 1. */
function RecentReadings() {
  const q = useQuery({
    queryKey: ["tarot", "history", "home"],
    queryFn: () => getReadingHistory(0, 3),
  });
  const rows = q.data?.content ?? [];

  return (
    <Card
      icon={History}
      title="Trải bài gần đây"
      to="/tarot-history"
      linkLabel="Toàn bộ lịch sử"
      loading={q.isPending}
    >
      {rows.length === 0 ? (
        <Empty text="Bạn chưa hỏi bài lần nào." to="/tarot" cta="Trải bài đầu tiên" />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/5 px-3 py-2.5">
              <p className="truncate text-sm text-foreground">
                {r.mainQuestion || "(không có câu hỏi)"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Bản đồ sao chính.
 *
 * Trang chủ hứa "AI đọc theo bản đồ sao ngày sinh", nên đây là dữ liệu nền của
 * cả hai trụ cột kia — nhưng cho tới giờ người dùng không có chỗ nào nhìn thấy
 * hệ thống đang dùng lá số nào của mình.
 */
function PrimaryChart() {
  const q = useQuery({
    queryKey: ["astrology", "primary"],
    queryFn: getPrimaryAstrologyProfile,
    // Chưa có hồ sơ chính thì BE trả 404 — thử lại cũng không đổi kết quả.
    retry: false,
  });
  const p = q.isSuccess ? q.data : null;

  return (
    <Card
      icon={Sparkles}
      title="Bản đồ sao của bạn"
      to="/profile/astrology"
      linkLabel="Quản lý bản đồ sao"
      loading={q.isPending}
    >
      {!p ? (
        <Empty
          text="Chưa có bản đồ sao chính. AI cần ngày, giờ và nơi sinh để đọc sát hơn."
          to="/profile/astrology"
          cta="Tạo bản đồ sao"
        />
      ) : (
        <dl className="space-y-1.5 text-sm">
          <Row label="Hồ sơ" value={p.title} />
          <Row label="Ngày sinh" value={fmtDate(p.birthDate)} />
          <Row
            label="Giờ sinh"
            value={p.birthTime ? p.birthTime.slice(0, 5) : "Chưa biết giờ"}
          />
          <Row label="Nơi sinh" value={p.birthPlace} />
        </dl>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// Khung chung
// ------------------------------------------------------------

function Card({
  icon: Icon,
  title,
  to,
  linkLabel,
  loading,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  to: string;
  linkLabel: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="glass flex flex-col rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Icon className="h-4 w-4 text-gold" />
          {title}
        </h2>
        <Link
          to={to}
          className="flex shrink-0 items-center gap-0.5 text-xs text-gold transition hover:underline"
        >
          {linkLabel}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 flex-1">
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            <div className="h-14 animate-pulse rounded-xl bg-mystic/10" />
            <div className="h-14 animate-pulse rounded-xl bg-mystic/10" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Empty({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="flex h-full flex-col items-start justify-between gap-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        to={to}
        className="rounded-full border border-gold/40 px-4 py-1.5 text-xs text-gold transition hover:bg-gold/10"
      >
        {cta}
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 truncate text-foreground/90">{value || "—"}</dd>
    </div>
  );
}
