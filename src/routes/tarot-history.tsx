// Lịch sử trải bài AI của người dùng — phần "xem lại" của trụ cột 1.
//
// Trước đây menu có mục "Lịch sử tư vấn" nhưng bấm không ra gì vì chưa có
// endpoint. Giờ BE trả GET /api/ai-readings (lượt của chính mình, mới nhất
// trước); trang này liệt kê, và mở một lượt ra thì tải lại lời giải AI đã lưu.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { History, Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import {
  getReadingHistory,
  getReadingMessages,
  type ReadingMessage,
} from "@/api/tarot";

export const Route = createFileRoute("/tarot-history")({
  head: () => ({ meta: [{ title: "Lịch sử trải bài — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["USER_BASIC"]}>
      <TarotHistoryPage />
    </RoleGuard>
  ),
});

function fmt(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TarotHistoryPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["tarot", "history", page],
    queryFn: () => getReadingHistory(page, 20),
  });

  const rows = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-gold" />
              <h1 className="font-display text-3xl sm:text-4xl">Lịch sử trải bài</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Những lần bạn hỏi bài trước đây. Mở một lượt để xem lại lời giải.
            </p>
          </div>
          <Link
            to="/tarot"
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90"
          >
            <Plus className="h-4 w-4" />
            Trải bài mới
          </Link>
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass h-16 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
              Không tải được lịch sử. Thử lại sau.
            </div>
          ) : rows.length === 0 ? (
            <div className="glass flex flex-col items-center gap-2 rounded-2xl py-12 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 text-gold/70" />
              <p className="text-sm">Bạn chưa có lượt trải bài nào.</p>
              <Link to="/tarot" className="mt-1 text-sm text-gold underline-offset-4 hover:underline">
                Trải bài đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <HistoryItem key={r.id} id={r.id} question={r.mainQuestion} at={r.createdAt} model={r.aiModelUsed} />
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-muted-foreground">{page + 1}/{totalPages}</span>
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
      </main>
    </div>
  );
}

function HistoryItem({
  id,
  question,
  at,
  model,
}: {
  id: string;
  question: string;
  at: string;
  model: string | null;
}) {
  const [open, setOpen] = useState(false);
  const detail = useQuery({
    queryKey: ["tarot", "reading", id, "messages"],
    queryFn: () => getReadingMessages(id),
    enabled: open,
  });

  // BE có thể trả List hoặc Page — chuẩn hoá về mảng.
  const raw = detail.data;
  const messages: ReadingMessage[] = Array.isArray(raw)
    ? raw
    : ((raw as { content?: ReadingMessage[] } | undefined)?.content ?? []);
  const aiMessages = messages.filter((m) => m.senderType === "AI");

  return (
    <li className="glass overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-lg">
          🔮
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{question || "(không có câu hỏi)"}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {fmt(at)}
            {model ? ` · ${model}` : ""}
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-gold/10 px-4 py-4">
          {detail.isLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-mystic/10" />
          ) : aiMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có lời giải lưu lại cho lượt này.</p>
          ) : (
            <div className="space-y-3">
              {aiMessages.map((m) => (
                <p key={m.id} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {m.content}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
