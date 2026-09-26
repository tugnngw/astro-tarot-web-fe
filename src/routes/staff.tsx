// Bàn làm việc của Nhân viên (STAFF).
//
// STAFF gánh hai vai: hỗ trợ khách, và nhận booking với tư cách Reader —
// READER cũ đã gộp vào STAFF (xem migration V2_0 và src/lib/roles.ts).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ReaderWorkspace } from "@/features/readers/components/ReaderWorkspace";
import { useAuth } from "@/lib/auth-context";
import { BookingList } from "@/features/booking/components/BookingList";
import {
  demTheoNgay,
  DieuHuongThang,
  homNayVn,
  LuoiNgay,
  ngayVn,
  thangRiengHopLe,
} from "@/features/booking/components/LichThang";
import { StaffSupportQueue } from "@/features/support/components/StaffSupportQueue";
import { useReaderBookingMonth } from "@/features/booking/queries";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/api/booking";
import { EarningsPanel } from "@/features/money/components/EarningsPanel";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Bàn làm việc — ASTROTAROT" }] }),
  // Tab đang mở nằm ở đường dẫn để gửi liên kết được. Dấu ? là bắt buộc: thiếu
  // nó thì TanStack coi khoá này là BẮT BUỘC, và mọi <Link to="/staff"> trong app
  // sẽ báo thiếu prop `search`.
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search.tab === "string" ? { tab: search.tab } : {},
  component: () => (
    <RoleGuard require={["SUPPORT_VIEW"]}>
      <StaffWorkspace />
    </RoleGuard>
  ),
});

function StaffWorkspace() {
  // Mỗi tab chỉ hiện khi có đúng quyền API cần. ADMIN vào /staff vì có
  // SUPPORT_VIEW, nhưng không có PAYOUT_REQUEST — bày "Thu nhập" rồi để họ
  // bấm vào nhận 403 tệ hơn là ẩn hẳn.
  const { can } = useAuth();
  const coReader = can("READER_MANAGE_PROFILE");
  const coThuNhap = can("PAYOUT_REQUEST");

  return (
    <WorkspaceShell
      title="Bàn làm việc"
      subtitle="Nơi xử lý yêu cầu hỗ trợ của khách và quản lý phần việc Reader của bạn."
      tabs={[
        {
          key: "support",
          label: "Hỗ trợ khách",
          render: () => <StaffSupportQueue />,
        },
        ...(coReader
          ? [
              {
                key: "bookings",
                label: "Lịch hẹn",
                render: () => <ReaderBookings />,
              },
            ]
          : []),
        ...(coThuNhap
          ? [
              {
                key: "earnings",
                label: "Thu nhập",
                render: () => <EarningsPanel />,
              },
            ]
          : []),
        ...(coReader
          ? [
              {
                key: "reader",
                label: "Hồ sơ Reader",
                render: () => <ReaderWorkspace />,
              },
            ]
          : []),
      ]}
    />
  );
}

/**
 * Lịch hẹn Reader nhận được.
 *
 * Trước đây chỗ này là một ô "chưa nối được" vì Booking chưa có tầng code nào
 * phía trên bảng. Nay đã có, nên nối vào dữ liệu thật.
 */
function ReaderBookings() {
  const [status, setStatus] = useState("");
  const hom = homNayVn();
  const [year, setYear] = useState(hom.year);
  const [month, setMonth] = useState(hom.month);
  const [ngay, setNgay] = useState<string | null>(null);
  const query = useReaderBookingMonth(year, month);

  const filters = [
    { key: "", label: "Tất cả" },
    ...(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => ({
      key: s,
      label: BOOKING_STATUS_LABEL[s],
    })),
  ];

  const loc = (query.data ?? []).filter((b) => !status || b.status === status);
  const hien = ngay ? loc.filter((b) => ngayVn(b.startTime) === ngay) : loc;

  return (
    <div>
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Lọc theo trạng thái"
      >
        {filters.map((f) => (
          <button
            key={f.key || "all"}
            type="button"
            onClick={() => setStatus(f.key)}
            aria-pressed={status === f.key}
            className={`rounded-full border px-4 py-1.5 text-xs transition hover:border-gold/70 hover:bg-gold/10 active:scale-95 ${
              status === f.key
                ? "border-gold bg-gold/20 text-gold"
                : "border-mystic/50 bg-mystic/10 text-foreground/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="glass mb-4 rounded-2xl p-4">
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
          Số là số buổi trong ngày. Cùng một ngày nhiều khách đặt được, miễn
          khác khung giờ. Bấm ngày để xem tên khách.
        </p>
      </section>

      <div aria-live="polite" aria-busy={query.isFetching}>
        <BookingList
          bookings={hien}
          side="reader"
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
    </div>
  );
}
