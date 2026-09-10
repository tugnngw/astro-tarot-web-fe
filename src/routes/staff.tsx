// Bàn làm việc của Nhân viên (STAFF).
//
// STAFF gánh hai vai: hỗ trợ khách, và nhận booking với tư cách Reader —
// READER cũ đã gộp vào STAFF (xem migration V2_0 và src/lib/roles.ts).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, MessageCircle, Star } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ReaderWorkspace } from "@/features/readers/components/ReaderWorkspace";
import { useAuth } from "@/lib/auth-context";
import { BookingList } from "@/features/booking/components/BookingList";
import { StaffSupportQueue } from "@/features/support/components/StaffSupportQueue";
import { useReaderBookings } from "@/features/booking/queries";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/api/booking";
import { EarningsPanel } from "@/features/money/components/EarningsPanel";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Bàn làm việc — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["SUPPORT_VIEW"]}>
      <StaffWorkspace />
    </RoleGuard>
  ),
});

function StaffWorkspace() {
  // Quản lý cũng có SUPPORT_VIEW nên vào được trang này để giám sát hàng chờ,
  // nhưng họ không có READER_MANAGE_PROFILE. Ẩn hẳn tab Reader thay vì để họ
  // bấm vào rồi nhận 403 — đúng tinh thần "không bày nút bấm vào sẽ hỏng".
  const { can } = useAuth();

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
        ...(can("READER_MANAGE_PROFILE")
          ? [
              {
                key: "bookings",
                label: "Lịch hẹn",
                render: () => <ReaderBookings />,
              },
              {
                key: "earnings",
                label: "Thu nhập",
                render: () => <EarningsPanel />,
              },
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
  const query = useReaderBookings({ status: status || undefined, page: 0, size: 50 });

  const filters = [
    { key: "", label: "Tất cả" },
    ...(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => ({
      key: s,
      label: BOOKING_STATUS_LABEL[s],
    })),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
        {filters.map((f) => (
          <button
            key={f.key || "all"}
            type="button"
            onClick={() => setStatus(f.key)}
            aria-pressed={status === f.key}
            className={
              status === f.key
                ? "rounded-full border border-gold bg-gold/20 px-4 py-1.5 text-xs text-gold"
                : "rounded-full border border-mystic/50 bg-mystic/10 px-4 py-1.5 text-xs text-foreground/80 transition hover:border-gold/60"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" aria-busy={query.isFetching}>
        <BookingList
          bookings={query.data?.content ?? []}
          side="reader"
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </div>
    </div>
  );
}

