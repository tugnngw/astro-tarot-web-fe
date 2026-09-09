// Trang hỗ trợ của khách — phía người dùng của tab "Hỗ trợ khách" bên Nhân viên.
//
// Khách mở yêu cầu và theo dõi trả lời ở đây; nhân viên xử lý ở /staff. Cùng
// một API (/api/v1/support), hai góc nhìn.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, LifeBuoy, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { useMyTickets, useCreateTicket } from "@/features/support/queries";
import { TicketThread } from "@/features/support/components/TicketThread";
import { TICKET_STATUS_LABEL, type TicketStatus } from "@/api/support";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Hỗ trợ — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["USER_BASIC"]}>
      <SupportPage />
    </RoleGuard>
  ),
});

const STATUS_PILL: Record<TicketStatus, string> = {
  OPEN: "bg-amber-400/15 text-amber-300",
  PENDING: "bg-sky-400/15 text-sky-300",
  RESOLVED: "bg-emerald-400/15 text-emerald-300",
  CLOSED: "bg-mystic/20 text-muted-foreground",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SupportPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-gold" />
              <h1 className="font-display text-3xl sm:text-4xl">Hỗ trợ</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Gửi câu hỏi hoặc vướng mắc, đội hỗ trợ sẽ trả lời ngay trong trang này.
            </p>
          </div>
          {!selected && !creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90"
            >
              <Plus className="h-4 w-4" />
              Yêu cầu mới
            </button>
          )}
        </div>

        <div className="mt-6">
          {selected ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Về danh sách
              </button>
              <TicketThread ticketId={selected} />
            </div>
          ) : creating ? (
            <NewTicketForm
              onCancel={() => setCreating(false)}
              onCreated={(id) => {
                setCreating(false);
                setSelected(id);
              }}
            />
          ) : (
            <MyTickets onOpen={setSelected} />
          )}
        </div>
      </main>
    </div>
  );
}

function MyTickets({ onOpen }: { onOpen: (id: string) => void }) {
  const query = useMyTickets(0);
  const rows = query.data?.content ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass h-16 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl py-12 text-center text-muted-foreground">
        <MessageSquare className="h-8 w-8" />
        <p className="text-sm">Bạn chưa có yêu cầu hỗ trợ nào.</p>
      </div>
    );
  }

  return (
    <ul className="glass divide-y divide-gold/10 rounded-2xl px-4">
      {rows.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onOpen(t.id)}
            className="flex w-full items-center gap-3 py-3.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{t.subject}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.messageCount} tin · cập nhật {fmt(t.updatedAt)}
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${STATUS_PILL[t.status]}`}>
              {TICKET_STATUS_LABEL[t.status]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NewTicketForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const create = useCreateTicket();

  async function submit() {
    if (!subject.trim() || !body.trim()) return;
    try {
      const ticket = await create.mutateAsync({ subject: subject.trim(), body: body.trim() });
      toast.success("Đã gửi yêu cầu hỗ trợ");
      onCreated(ticket.id);
    } catch {
      toast.error("Không gửi được, thử lại giúp mình.");
    }
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <div>
        <label className="mb-1 block text-sm text-foreground/80">Tiêu đề</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="Bạn cần hỗ trợ việc gì?"
          className="w-full rounded-xl border border-mystic/40 bg-mystic/10 px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-foreground/80">Nội dung</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Mô tả chi tiết để đội hỗ trợ nắm nhanh…"
          className="w-full resize-none rounded-xl border border-mystic/40 bg-mystic/10 px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={create.isPending || !subject.trim() || !body.trim()}
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-50"
        >
          Gửi yêu cầu
        </button>
      </div>
    </div>
  );
}
