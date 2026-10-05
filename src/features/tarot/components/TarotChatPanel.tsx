// Khung chat Tarot AI — bố cục sidebar phiên (kiểu ASM_PRN222) + theme vàng/tối AstroTarot.
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Menu,
  MessageSquarePlus,
  PanelLeftClose,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type { ChatMessage, TarotChatSession } from "../chatSessions";

const PAGE_SIZE = 50;

const SUGGESTIONS = [
  "Hôm nay năng lượng của mình thế nào?",
  "Mối quan hệ này đang đi về đâu?",
  "Công việc sắp tới có thuận không?",
];

export interface TarotChatPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  send: (e?: React.FormEvent) => void;
  resetAll: () => void;
  clearChatHistory: () => void;
  headerName: string;
  lastMsgRef: React.RefObject<HTMLDivElement | null>;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  cardsDrawn: boolean;
  drawing: boolean;
  onDrawCards: () => void;
  sessions: TarotChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function TarotChatPanel({
  messages,
  thinking,
  input,
  setInput,
  send,
  resetAll,
  clearChatHistory,
  headerName,
  lastMsgRef,
  chatScrollRef,
  cardsDrawn,
  drawing,
  onDrawCards,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: TarotChatPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return messages;
    const q = deferredQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const start = Math.max(0, filtered.length - (pageSafe + 1) * PAGE_SIZE);
  const end = filtered.length - pageSafe * PAGE_SIZE;
  const view = filtered.slice(start, end);

  const onSearch = useCallback((v: string) => {
    setQuery(v);
    setPage(0);
  }, []);

  const pickSuggestion = (text: string) => {
    setInput(text);
  };

  const sidebar = (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-gold/20 bg-card/50 backdrop-blur-md">
      <div className="space-y-2 border-b border-gold/15 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/80">
          Phiên trò chuyện
        </p>
        <button
          type="button"
          onClick={() => {
            onNewSession();
            setSidebarOpen(false);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs font-semibold text-primary-foreground glow-gold transition hover:bg-gold-soft"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Phiên mới
        </button>
        <Link
          to="/tarot-history"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gold/30 px-3 py-2 text-xs text-gold transition hover:bg-gold/10"
        >
          <History className="h-3.5 w-3.5" />
          Lịch sử trải bài
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
          Gần đây
        </p>
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-muted-foreground/70">
            Chưa có phiên nào. Bắt đầu hỏi để tạo phiên đầu tiên.
          </p>
        ) : (
          sessions.map((s) => {
            const active = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                className={`group mb-1 flex items-start gap-1 rounded-xl border transition ${
                  active
                    ? "border-gold/45 bg-gold/10"
                    : "border-transparent hover:border-gold/20 hover:bg-card/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(s.id);
                    setSidebarOpen(false);
                  }}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left"
                >
                  <div className="truncate text-xs font-medium text-foreground">
                    {s.title || "Phiên mới"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatSessionTime(s.updatedAt)}
                    {s.cardsDrawn ? " · Đã rút bài" : ""}
                  </div>
                </button>
                <button
                  type="button"
                  title="Xóa phiên"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Xóa phiên này?")) onDeleteSession(s.id);
                  }}
                  className="mr-1 mt-1.5 rounded-lg p-1 text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-gold/25 bg-card/40 shadow-[0_0_40px_-12px_rgba(212,175,55,0.25)] backdrop-blur-xl">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile drawer */}
      {sidebarOpen ? (
        <div className="absolute inset-0 z-30 flex md:hidden">
          <button
            type="button"
            aria-label="Đóng danh sách phiên"
            className="absolute inset-0 bg-black/55"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gold/20 bg-gradient-to-r from-gold/10 via-transparent to-transparent px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              className="rounded-lg border border-gold/25 p-1.5 text-gold md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở danh sách phiên"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative shrink-0">
              <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-gold/15 text-gold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm text-gold-soft sm:text-base">
                Tarot AI
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                Trực tuyến · {headerName}
                {cardsDrawn ? (
                  <span className="ml-1.5 inline-flex rounded-full bg-gold/15 px-1.5 py-0.5 text-gold">
                    Đã rút bài
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {!cardsDrawn && !drawing ? (
              <button
                type="button"
                onClick={onDrawCards}
                className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground glow-gold transition hover:scale-105 sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                <Wand2 className="h-3 w-3" />
                <span className="hidden xs:inline sm:inline">Rút bài</span>
              </button>
            ) : null}
            {drawing ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-full bg-gold/55 px-3 py-1.5 text-xs text-primary-foreground"
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Đang rút…
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 rounded-full border border-gold/35 px-2.5 py-1.5 text-[11px] text-gold transition hover:bg-gold/10 sm:text-xs"
              title="Làm mới form & bắt đầu lại"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Xóa toàn bộ tin nhắn phiên hiện tại?")) {
                  clearChatHistory();
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-red-500/35 px-2.5 py-1.5 text-[11px] text-red-400 transition hover:bg-red-500/10 sm:text-xs"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
            <button
              type="button"
              className="hidden rounded-full border border-gold/25 p-1.5 text-muted-foreground transition hover:text-gold md:inline-flex"
              title="Ẩn/hiện danh sách phiên trên điện thoại"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search strip */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gold/10 bg-background/25 px-3 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gold/25 bg-input/40 px-3 focus-within:border-gold/60">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Tìm trong phiên này…"
              className="flex-1 bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground/55"
            />
            {query ? (
              <button type="button" onClick={() => onSearch("")}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <button
              type="button"
              disabled={pageSafe >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 hover:bg-gold/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="min-w-[36px] text-center">
              {pageSafe + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 hover:bg-gold/10 disabled:opacity-30"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.06),_transparent_55%)] px-3 py-4 sm:px-5"
        >
          {view.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="font-display text-lg text-foreground">
                Vũ trụ đang lắng nghe
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Đặt câu hỏi, hoặc chọn gợi ý bên dưới. Rút bài khi muốn AI đọc
                theo trải bài.
              </p>
              <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="rounded-full border border-gold/30 bg-card/60 px-3 py-1.5 text-left text-[11px] text-foreground/90 transition hover:border-gold hover:bg-gold/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            view.map((m, idx) => (
              <div
                key={m.id}
                ref={
                  idx === view.length - 1 && pageSafe === 0 ? lastMsgRef : null
                }
                className="animate-in fade-in slide-in-from-bottom-1 duration-300"
              >
                <Bubble role={m.role} content={m.content} ts={m.ts} />
              </div>
            ))
          )}

          {pageSafe === 0 && thinking ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-gold/25 bg-card/70 px-4 py-2.5 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-gold animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs">Đang suy ngẫm…</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Composer */}
        <form
          onSubmit={send}
          className="shrink-0 border-t border-gold/20 bg-background/40 p-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-gold/30 bg-input/50 p-1.5 focus-within:border-gold/70 focus-within:ring-1 focus-within:ring-gold/25">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Hỏi vũ trụ… (Enter gửi, Shift+Enter xuống dòng)"
              className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/55"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatSessionTime(ts: number) {
  try {
    return new Date(ts).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatMsgTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const Bubble = memo(function Bubble({
  role,
  content,
  ts,
}: {
  role: "user" | "ai";
  content: string;
  ts: number;
}) {
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");

  const isUser = role === "user";

  return (
    <div className={`mb-3 flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/35 bg-gold/15 text-gold">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      ) : null}
      <div className={`max-w-[min(85%,36rem)] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {!isUser ? (
          <span className="mb-1 text-[10px] text-muted-foreground">Tarot AI</span>
        ) : null}
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-gold to-gold-soft text-primary-foreground"
              : "rounded-2xl rounded-bl-md border border-gold/20 bg-card/85 text-foreground/92"
          }`}
        >
          <div
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground/70">
          {formatMsgTime(ts)}
        </span>
      </div>
    </div>
  );
});
