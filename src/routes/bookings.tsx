// Lịch hẹn của Thành viên — phía khách của trụ cột 2.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { BookingList } from "@/features/booking/components/BookingList";
import { PAGE_SIZE, PagedList, Pagination } from "@/components/Pagination";
import { useMyBookings } from "@/features/booking/queries";
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
  const [status, setStatus] = useState("");
  const { payment } = Route.useSearch();
  const [page, setPage] = useState(0);
  const query = useMyBookings({ status: status || undefined, page, size: PAGE_SIZE });

  useEffect(() => {
    if (payment === "success") {
      toast.success("Đã quay lại từ PayOS — trạng thái sẽ cập nhật sau khi nhận tiền");
      void query.refetch();
    } else if (payment === "cancel") {
      toast.message("Bạn đã huỷ thanh toán trên PayOS");
    }
  }, [payment]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">Lịch hẹn của tôi</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Buổi xem với Reader thật. Sau khi hoàn tất bạn có thể để lại đánh giá —
              đó là thứ giúp người sau chọn đúng Reader.
            </p>
          </div>
          <Link
            to="/readers"
            className="rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
          >
            Tìm Reader
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => {
              setStatus(f.key);
              setPage(0);
            }}
              aria-pressed={status === f.key}
              className={`rounded-full border px-4 py-1.5 text-xs transition focus-visible:ring-2 focus-visible:ring-gold/40 ${
                status === f.key
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-mystic/50 bg-mystic/10 text-foreground/80 hover:border-gold/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6" aria-live="polite" aria-busy={query.isFetching}>
          <PagedList>
            <BookingList
              bookings={query.data?.content ?? []}
              side="customer"
              isPending={query.isPending}
              isError={query.isError}
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          </PagedList>
          <Pagination
            page={page}
            totalPages={query.data?.totalPages ?? 0}
            totalElements={query.data?.totalElements ?? 0}
            onChange={setPage}
            busy={query.isFetching}
            unit="lịch hẹn"
          />
        </div>
      </main>
    </div>
  );
}
