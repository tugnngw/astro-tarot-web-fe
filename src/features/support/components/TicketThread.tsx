// Luồng trao đổi của một ticket: danh sách tin nhắn + ô trả lời.
//
// Dùng chung cho cả khách (trang /support) và nhân viên (tab Hỗ trợ khách).
// Tin của người đang xem căn phải, tin của phía bên kia căn trái — chuẩn đọc
// của mọi cửa sổ hội thoại, khỏi phải học lại.
import { useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTicket, useReplyTicket, useUpdateTicketStatus } from "@/features/support/queries";
import { TICKET_STATUS_LABEL, type TicketStatus } from "@/api/support";

const STATUS_PILL: Record<TicketStatus, string> = {
  OPEN: "bg-amber-400/15 text-amber-300",
  PENDING: "bg-sky-400/15 text-sky-300",
  RESOLVED: "bg-emerald-400/15 text-emerald-300",
  CLOSED: "bg-mystic/20 text-muted-foreground",
};

// Nhân viên chuyển ticket sang các trạng thái này; khách không thấy ô đổi.
const STAFF_NEXT: TicketStatus[] = ["PENDING", "RESOLVED", "CLOSED"];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketThread({
  ticketId,
  staffControls = false,
}: {
  ticketId: string;
  /** true khi nhân viên mở — hiện ô đổi trạng thái. */
  staffControls?: boolean;
}) {
  const { user, can } = useAuth();
  const query = useTicket(ticketId);
  const reply = useReplyTicket();
  const updateStatus = useUpdateTicketStatus();
  const [draft, setDraft] = useState("");

  if (query.isLoading) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }
  if (query.isError || !query.data) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
        Không tải được nội dung yêu cầu.
      </div>
    );
  }

  const ticket = query.data;
  const closed = ticket.status === "CLOSED";

  // Quản lý có SUPPORT_VIEW nhưng KHÔNG có SUPPORT_RESPOND: họ giám sát hàng
  // chờ chứ không trực tiếp trả lời khách. Trước đây ô trả lời vẫn hiện cho
  // họ, gõ xong bấm Gửi thì nhận 403 — đúng thứ "nút bấm vào sẽ hỏng" mà cả
  // dự án này cố tránh. Ở trang khách (staffControls = false) thì không xét:
  // khách trả lời ticket của chính mình chỉ cần USER_BASIC.
  const canRespond = !staffControls || can("SUPPORT_RESPOND");

  async function send() {
    const body = draft.trim();
    if (!body) return;
    try {
      await reply.mutateAsync({ ticketId, body });
      setDraft("");
    } catch {
      toast.error("Không gửi được, thử lại giúp mình.");
    }
  }

  async function changeStatus(status: TicketStatus) {
    try {
      await updateStatus.mutateAsync({ ticketId, status });
      toast.success(`Đã chuyển sang "${TICKET_STATUS_LABEL[status]}"`);
    } catch {
      toast.error("Không đổi được trạng thái.");
    }
  }

  return (
    <div className="glass flex flex-col rounded-2xl">
      {/* Đầu luồng: tiêu đề + trạng thái + (nhân viên) ô đổi */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gold/10 p-4">
        <div>
          <h3 className="font-display text-lg">{ticket.subject}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ticket.requesterName}
            {ticket.assignedToName ? ` · phụ trách: ${ticket.assignedToName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_PILL[ticket.status]}`}>
            {TICKET_STATUS_LABEL[ticket.status]}
          </span>
          {staffControls && canRespond && (
            <select
              value=""
              onChange={(e) => e.target.value && changeStatus(e.target.value as TicketStatus)}
              className="rounded-full border border-mystic/50 bg-mystic/10 px-3 py-1 text-xs text-foreground/80"
              aria-label="Đổi trạng thái"
            >
              <option value="">Đổi trạng thái…</option>
              {STAFF_NEXT.filter((s) => s !== ticket.status).map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Các tin nhắn */}
      <div className="max-h-[26rem] space-y-3 overflow-y-auto p-4">
        {ticket.messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "bg-gold/15 text-foreground"
                    : "bg-mystic/15 text-foreground/90"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {m.fromStaff && <ShieldCheck className="h-3 w-3 text-gold" />}
                  <span>{m.fromStaff ? `${m.senderName} · Hỗ trợ` : m.senderName}</span>
                  <span>· {fmt(m.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ô trả lời */}
      {closed ? (
        <p className="border-t border-gold/10 p-4 text-center text-sm text-muted-foreground">
          Yêu cầu đã đóng.
        </p>
      ) : !canRespond ? (
        <p className="border-t border-gold/10 p-4 text-center text-sm text-muted-foreground">
          Bạn xem được hàng chờ nhưng không trả lời khách — phần đó thuộc nhân viên hỗ trợ.
        </p>
      ) : (
        <div className="flex items-end gap-2 border-t border-gold/10 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter gửi, Shift+Enter xuống dòng — thói quen của mọi ô chat.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Nhập nội dung trả lời…"
            className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-mystic/40 bg-mystic/10 px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={reply.isPending || !draft.trim()}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Gửi
          </button>
        </div>
      )}
    </div>
  );
}
