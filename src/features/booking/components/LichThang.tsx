// Lịch tháng kiểu ô ngày — một ô một ngày, bấm vào là thấy giờ.
//
// Giờ Việt Nam cố định, cùng múi với lịch Reader khai trên máy chủ. Dùng giờ
// máy người xem thì người đang ở nước khác thấy ngày lệch và đặt nhầm.
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking, CalendarDay, CalendarDayKind } from "@/api/booking";

const ZONE = "Asia/Ho_Chi_Minh";
const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function homNayVn(): {
  year: number;
  month: number;
  day: number;
  iso: string;
} {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day, iso: s };
}

export function ngayVn(isoInstant: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoInstant));
}

export function gioVn(isoInstant: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoInstant));
}

/** Tháng này và hai tháng tới — khớp luật máy chủ của lịch đặt. */
export function thangDatHopLe(year: number, month: number) {
  const n = homNayVn();
  const hien = n.year * 12 + (n.month - 1);
  const xin = year * 12 + (month - 1);
  return xin >= hien && xin <= hien + 2;
}

/** Lịch riêng nhìn lại một năm và tới nửa năm. */
export function thangRiengHopLe(year: number, month: number) {
  const n = homNayVn();
  const hien = n.year * 12 + (n.month - 1);
  const xin = year * 12 + (month - 1);
  return xin >= hien - 12 && xin <= hien + 6;
}

export function tenThang(year: number, month: number) {
  return `Tháng ${month} năm ${year}`;
}

function oTrongDauThang(year: number, month: number) {
  const thu = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (thu + 6) % 7;
}

const NUT =
  "inline-flex items-center justify-center rounded-lg border border-mystic/40 text-foreground/80 transition hover:border-gold/60 hover:bg-gold/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-30";

export function DieuHuongThang({
  year,
  month,
  coTruoc,
  coSau,
  onMove,
}: {
  year: number;
  month: number;
  coTruoc: boolean;
  coSau: boolean;
  onMove: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        className={`${NUT} h-8 w-8`}
        aria-label="Tháng trước"
        disabled={!coTruoc}
        onClick={() => onMove(-1)}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <p className="font-display text-lg">{tenThang(year, month)}</p>
      <button
        type="button"
        className={`${NUT} h-8 w-8`}
        aria-label="Tháng sau"
        disabled={!coSau}
        onClick={() => onMove(1)}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

function dauCham(kind: CalendarDayKind) {
  switch (kind) {
    case "OPEN":
      return "bg-gold";
    case "FULL":
      return "bg-foreground/35";
    case "OFF":
      return "bg-transparent ring-1 ring-foreground/30";
    default:
      return "bg-transparent";
  }
}

export function LuoiNgay({
  year,
  month,
  selected,
  onSelect,
  loai,
  soBuoi,
  khoaQuaKhu,
}: {
  year: number;
  month: number;
  selected: string | null;
  onSelect: (iso: string) => void;
  loai?: Map<string, CalendarDayKind>;
  soBuoi?: Map<string, number>;
  /** Lịch đặt: ngày đã qua không chọn được. Lịch riêng vẫn bấm để xem buổi cũ. */
  khoaQuaKhu?: boolean;
}) {
  const hom = homNayVn().iso;
  const soNgay = new Date(year, month, 0).getDate();
  const trong = oTrongDauThang(year, month);
  const o: Array<string | null> = [
    ...Array.from({ length: trong }, () => null),
    ...Array.from({ length: soNgay }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const m = String(month).padStart(2, "0");
      return `${year}-${m}-${d}`;
    }),
  ];
  while (o.length % 7 !== 0) o.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {THU.map((t) => (
          <div key={t} className="py-1">
            {t}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {o.map((iso, i) => {
          if (!iso) return <div key={`trong-${i}`} />;
          const ngay = Number(iso.slice(-2));
          const kind = loai?.get(iso);
          const dem = soBuoi?.get(iso) ?? 0;
          const dangChon = selected === iso;
          const laHomNay = iso === hom;
          const quaKhu = kind === "PAST" || (khoaQuaKhu === true && iso < hom);
          return (
            <button
              key={iso}
              type="button"
              disabled={quaKhu}
              onClick={() => {
                if (!quaKhu) onSelect(iso);
              }}
              aria-pressed={dangChon}
              aria-label={iso}
              className={`flex h-11 flex-col items-center justify-center rounded-lg text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed ${
                dangChon
                  ? "bg-gold/20 text-gold ring-1 ring-gold"
                  : quaKhu
                    ? ""
                    : "hover:bg-gold/10 active:scale-95"
              } ${quaKhu ? "text-muted-foreground/35" : "text-foreground"}`}
            >
              <span
                className={
                  laHomNay && !dangChon
                    ? "flex h-5 w-5 items-center justify-center rounded-full border border-gold/70"
                    : ""
                }
              >
                {ngay}
              </span>
              {dem > 0 ? (
                <span className="mt-0.5 text-[9px] leading-none text-gold">
                  {dem}
                </span>
              ) : (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${kind ? dauCham(kind) : "bg-transparent"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChuThichDat() {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
      <li className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Còn trống
      </li>
      <li className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/35" /> Đã kín
      </li>
      <li className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full ring-1 ring-foreground/30" />{" "}
        Nghỉ
      </li>
    </ul>
  );
}

export function loiNgay(day: CalendarDay | undefined, laHomNay: boolean) {
  if (!day) return "Đang tải ngày này…";
  switch (day.kind) {
    case "OFF":
      return "Reader nghỉ ngày này.";
    case "CLOSED":
      return "Reader không làm việc ngày này.";
    case "FULL":
      return "Các khung của thời lượng này đã có người đặt. Cùng ngày vẫn đặt được khung khác, hoặc đổi thời lượng.";
    case "OVER":
      return laHomNay
        ? "Hôm nay đã qua giờ làm việc của Reader."
        : "Ngày này đã qua giờ làm việc.";
    case "PAST":
      return "Ngày đã qua.";
    default:
      return "Ngày này không còn khung trống.";
  }
}

const NHAN_TRANG_THAI: Record<Booking["status"], string> = {
  PENDING: "Chờ",
  CONFIRMED: "Đã nhận",
  COMPLETED: "Xong",
  CANCELLED: "Huỷ",
};

export function demTheoNgay(bookings: Booking[]) {
  const map = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    const k = ngayVn(b.startTime);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export function nhanO(b: Booking, side: "customer" | "reader") {
  const ten = side === "reader" ? b.customerName : b.readerName;
  return `${gioVn(b.startTime)} ${ten} · ${NHAN_TRANG_THAI[b.status]}`;
}
