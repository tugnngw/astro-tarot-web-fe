// Lịch hẹn của Thành viên — phía khách của trụ cột 2.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { BookingList } from "@/features/booking/components/BookingList";
import {
  demTheoNgay,
  DieuHuongThang,
  homNayVn,
  LuoiNgay,
  ngayVn,
  thangRiengHopLe,
} from "@/features/booking/components/LichThang";
import { useMyBookingMonth } from "@/features/booking/queries";
import { useAuth } from "@/lib/auth-context";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/api/booking";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Lịch hẹn của tôi — ASTROTAROT" }] }),
  // Kieu tra ve phai co dau ? o payment: neu de "string | undefined" thi
  // TanStack coi khoa nay la bat buoc, va MOI <Link to="/bookings"> trong app
  // se bao thieu prop `search`.
  validateSearch: (search: Record<string, unknown>): { payment?: string } =>
    typeof search.payment === "string" ? { payment: search.payment } : {},
  component: () => (
    <RoleGuard require={["USER_BASIC"]}>
      <MyBookingsPage />
    </RoleGuard>
  ),
});

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "", label: "Tất cả" },
  ...(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => ({
    key: s,
    label: BOOKING_STATUS_LABEL[s],
  })),
];

function MyBookingsPage() {
  const { can } = useAuth();
  // Trang này CHỈ có lịch do chính người dùng đặt với Reader. Lịch mà khách
  // đặt với họ là một danh sách khác, ở Bàn làm việc.
  //
  // Với tài khoản Reader hai thứ đó rất dễ lẫn, và khi lẫn thì cái họ thấy là
  // một danh sách trống — đúng về mặt dữ liệu, nhưng đọc lên thì giống hệt
  // "lịch khách vừa đặt đã biến mất". Nói rõ ngay tại chỗ dễ nhầm.
  const coLichKhachDat = can("READER_MANAGE_PROFILE");
  const [status, setStatus] = useState("");
  const { payment } = Route.useSearch();
  const hom = homNayVn();
  const [year, setYear] = useState(hom.year);
  const [month, setMonth] = useState(hom.month);
  const [ngay, setNgay] = useState<string | null>(null);
  const query = useMyBookingMonth(year, month);

  useEffect(() => {
    if (payment === "success") {
      toast.success(
        "Đã quay lại từ PayOS — trạng thái sẽ cập nhật sau khi nhận tiền",
      );
      void query.refetch();
    } else if (payment === "cancel") {
      toast.message("Bạn đã huỷ thanh toán trên PayOS");
    }
  }, [payment]); // eslint-disable-line react-hooks/exhaustive-deps

  const loc = (query.data ?? []).filter((b) => !status || b.status === status);
  const hien = ngay ? loc.filter((b) => ngayVn(b.startTime) === ngay) : loc;

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">
              Lịch hẹn của tôi
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Buổi xem với Reader thật. Sau khi hoàn tất bạn có thể để lại đánh
              giá — đó là thứ giúp người sau chọn đúng Reader.
            </p>
          </div>
          <Link
            to="/readers"
            className="rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
          >
            Tìm Reader
          </Link>
        </div>

        {coLichKhachDat && (
          <div className="glass mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Đây là những buổi <span className="text-foreground">bạn đặt</span>{" "}
              với Reader khác. Lịch khách đặt với bạn nằm ở Bàn làm việc.
            </p>
            <Link
              to="/staff"
              search={{ tab: "bookings" }}
              className="shrink-0 rounded-full border border-gold/50 px-4 py-1.5 text-xs text-gold transition hover:bg-gold/10"
            >
              Xem lịch khách đặt
            </Link>
          </div>
        )}

        <div
          className="mt-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Lọc theo trạng thái"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => setStatus(f.key)}
              aria-pressed={status === f.key}
              className={`rounded-full border px-4 py-1.5 text-xs transition hover:border-gold/70 hover:bg-gold/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-gold/40 ${
                status === f.key
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-mystic/50 bg-mystic/10 text-foreground/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="glass mt-4 rounded-2xl p-4">
          <DieuHuongThang
            year={year}
            month={month}
            coTruoc={thangRiengHopLe(
              month === 1 ? year - 1 : year,
              month === 1 ? 12 : month - 1,
            )}
            coSau={thangRiengHopLe(
              month === 12 ? year + 1 : year,
              month === 12 ? 1 : month + 1,
            )}
            onMove={(delta) => {
              const base = year * 12 + (month - 1) + delta;
              const y = Math.floor(base / 12);
              const m = (base % 12) + 1;
              if (!thangRiengHopLe(y, m)) return;
              setYear(y);
              setMonth(m);
              setNgay(null);
            }}
          />
          <div className="mt-2">
            <LuoiNgay
              year={year}
              month={month}
              selected={ngay}
              onSelect={(iso) => setNgay((cur) => (cur === iso ? null : iso))}
              soBuoi={demTheoNgay(loc)}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Số trên mỗi ngày là buổi chưa huỷ. Bấm một ngày để xem đúng ngày đó,
            bấm lại để xem cả tháng.
          </p>
        </section>

        <div className="mt-4" aria-live="polite" aria-busy={query.isFetching}>
          <BookingList
            bookings={hien}
            side="customer"
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            emptyText={
              ngay
                ? "Ngày này không có buổi nào với bộ lọc đang chọn."
                : undefined
            }
          />
        </div>
      </main>
    </div>
  );
}
