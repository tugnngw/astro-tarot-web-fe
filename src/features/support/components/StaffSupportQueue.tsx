// Hàng chờ hỗ trợ cho nhân viên (tab "Hỗ trợ khách" của /staff).
//
// Danh sách bên trái, luồng trao đổi bên phải khi chọn — cùng lối master–detail
// với các màn quản trị khác. Trước đây ô này là NotWiredYet vì backend chưa có
// bảng ticket; giờ đã có /api/v1/support.
import { useState } from "react";
import { ArrowLeft, Inbox, MessagesSquare } from "lucide-react";
import { useSupportQueue } from "@/features/support/queries";
import { TICKET_STATUS_LABEL, type TicketStatus } from "@/api/support";
import { TicketThread } from "./TicketThread";

const FILTERS: { key: TicketStatus | ""; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "OPEN", label: "Đang chờ" },
  { key: "PENDING", label: "Chờ khách" },
  { key: "RESOLVED", label: "Đã xong" },
  { key: "CLOSED", label: "Đã đóng" },
];

const STATUS_DOT: Record<TicketStatus, string> = {
  OPEN: "bg-amber-400",
  PENDING: "bg-sky-400",
  RESOLVED: "bg-emerald-400",
  CLOSED: "bg-muted-foreground",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffSupportQueue() {
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const query = useSupportQueue(status, page);

  const rows = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  if (selected) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Về hàng chờ
        </button>
        <TicketThread ticketId={selected} staffControls />
      </div>
    );
  }

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-gold" />
        <h2 className="font-display text-xl">Hàng chờ hỗ trợ</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Yêu cầu của khách, mới nhất trước. Trả lời một lần là ticket tự chuyển sang
        chờ khách phản hồi.
      </p>

      {/* Lọc theo trạng thái */}
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === status;
          return (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => {
                setStatus(f.key);
                setPage(0);
              }}
              className={`rounded-full px-3 py-1 text-sm transition ${
                active
                  ? "bg-gold font-medium text-background"
                  : "bg-mystic/10 text-foreground/70 hover:bg-mystic/20"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Danh sách */}
      <div className="mt-4">
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-mystic/10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">Không có yêu cầu nào ở mục này.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/10">
            {rows.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-mystic/5"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[t.status]}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.subject}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.requesterName} · {t.messageCount} tin · {fmt(t.updatedAt)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {TICKET_STATUS_LABEL[t.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-muted-foreground">
            {page + 1}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}
