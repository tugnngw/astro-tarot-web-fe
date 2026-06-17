// src/routes/tarot.tsx
import { createFileRoute } from "@tanstack/react-router";
import { lazy, memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, RotateCcw, Users, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { TAROT_DECK, getCardMeaning } from "@/lib/mock-data";
import { startAiTarotReading, type TarotReadingResult, type DrawnCardDetail } from "@/api/tarot";

const DrawStage = lazy(() => import("@/components/TarotDraw").then((m) => ({ default: m.TarotDraw })));

export const Route = createFileRoute("/tarot")({
  head: () => ({
    meta: [
      { title: "Tarot AI Reader — ASTROTAROT" },
      { name: "description", content: "Trò chuyện cùng AI Tarot cá nhân hoá dựa trên bản đồ sao của bạn." },
    ],
  }),
  component: TarotPage,
});

interface ChatMessage { id: string; role: "user" | "ai"; content: string; ts: number }
interface Person { id: string; name: string; dob: string; birthTime: string; birthPlace: string }
type Stage = "info" | "draw" | "chat";

const MOCK_REPLIES = [
  "Vũ trụ đang gửi đến bạn lá The Star ✦ — biểu tượng của hy vọng và chữa lành.",
  "Mình cảm nhận năng lượng Mặt Trăng 🌙 — thời điểm để lắng nghe trực giác.",
  "Lá The Lovers xuất hiện 💞 — bạn đang đứng trước một lựa chọn quan trọng.",
  "Wheel of Fortune 🎡 — thay đổi là quy luật. Hãy lướt cùng dòng chảy.",
  "The Hermit 🔮 mời gọi bạn dành thời gian một mình để lắng nghe nội tâm.",
];

function storageKey(uid: string) { return `astrotarot_chat_${uid}`; }

function TarotPage() {
  const { user } = useAuth();
  const uid = user?.id || "guest";
  const [stage, setStage] = useState<Stage>("info");
  const [count, setCount] = useState(1);
  const [people, setPeople] = useState<Person[]>([{ id: "p1", name: "", dob: "", birthTime: "", birthPlace: "" }]);
  const [drawnCards, setDrawnCards] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readingResult, setReadingResult] = useState<TarotReadingResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);

  // Load history per user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(uid));
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.messages) && data.messages.length) {
          setMessages(data.messages);
          if (data.people) setPeople(data.people);
          if (data.drawnCards) setDrawnCards(data.drawnCards);
          if (data.readingResult) setReadingResult(data.readingResult);
          setStage("chat");
        }
      }
    } catch {}
  }, [uid]);

  // Persist
  useEffect(() => {
    if (stage === "chat") {
      localStorage.setItem(storageKey(uid), JSON.stringify({ messages, people, drawnCards, readingResult }));
    }
  }, [messages, stage, uid, people, drawnCards, readingResult]);

  // Scroll to last message
  useEffect(() => {
    lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const updateCount = (n: number) => {
    setCount(n);
    setPeople((prev) => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ id: `p${arr.length + 1}`, name: "", dob: "", birthTime: "", birthPlace: "" });
      return arr.slice(0, n);
    });
  };

  const updatePerson = (i: number, patch: Partial<Person>) =>
      setPeople((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  // ============================================================
  // GỌI API THAY VÌ MOCK
  // ============================================================
  const goDraw = async () => {
    for (const p of people) {
      if (!p.name.trim() || !p.dob.trim()) {
        toast.error("Vui lòng nhập đủ họ tên và ngày sinh cho mọi người.");
        return;
      }
    }

    setLoading(true);
    try {
      // Gọi API Tarot
      const result = await startAiTarotReading({
        question: `Xin chào, tôi là ${people[0].name}, sinh ngày ${people[0].dob}. Tôi muốn biết về tương lai của mình.`,
        numberOfCards: 3,
        includeReversed: true,
        spreadName: "Past-Present-Future",
      });

      setReadingResult(result);

      // Lấy tên các lá bài để hiển thị
      const cardNames = result.drawnCards.map(c => c.cardName);
      setDrawnCards(cardNames);
      setRevealed(false);
      setStage("draw");
      setTimeout(() => setRevealed(true), 500);

      toast.success("✨ Đã rút bài thành công!");
    } catch (error: any) {
      console.error("Tarot API error:", error);
      toast.error(error?.message || "Không thể rút bài, vui lòng thử lại");

      // Fallback to mock nếu API lỗi
      const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5).slice(0, 3);
      setDrawnCards(shuffled);
      setRevealed(false);
      setStage("draw");
      setTimeout(() => setRevealed(true), 500);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VÀO CHAT - Dùng AI Interpretation từ API
  // ============================================================
  const enterChat = () => {
    if (readingResult) {
      // Dùng kết quả từ API
      const cardLines = readingResult.drawnCards.map((c, i) => {
        const positions = ["Quá khứ", "Hiện tại", "Tương lai"];
        return `• ${positions[i] || i+1}: **${c.cardName}** ${c.reversed ? '(ngược)' : '(xuôi)'}`;
      }).join("\n");

      setMessages([{
        id: "welcome",
        role: "ai",
        content: `✨ **AI Tarot Reading** ✨\n\nDựa trên 3 lá bài bạn vừa rút:\n${cardLines}\n\n---\n\n${readingResult.aiInterpretation}\n\n---\n\n💫 Bạn có thắc mắc gì thêm về bài đọc này không? Mình sẵn sàng giải đáp!`,
        ts: Date.now(),
      }]);
    } else {
      // Fallback nếu không có kết quả API
      const intro = people.map((p) => `${p.name} (${p.dob})`).join(", ");
      const cardLines = drawnCards.map((c, i) =>
          `• ${["Quá khứ", "Hiện tại", "Tương lai"][i]}: ${c} — ${getCardMeaning(c)}`
      ).join("\n");
      setMessages([{
        id: "welcome",
        role: "ai",
        content: `Chào ${intro} ✦\n\nDựa trên 3 lá bài bạn vừa rút:\n${cardLines}\n\n${MOCK_REPLIES[0]}`,
        ts: Date.now(),
      }]);
    }
    setStage("chat");
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() }]);
    setInput("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    setMessages((m) => [...m, {
      id: crypto.randomUUID(),
      role: "ai",
      content: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
      ts: Date.now()
    }]);
    setThinking(false);
  };

  const resetAll = () => {
    localStorage.removeItem(storageKey(uid));
    setStage("info");
    setMessages([]);
    setInput("");
    setDrawnCards([]);
    setReadingResult(null);
    setPeople([{ id: "p1", name: "", dob: "", birthTime: "", birthPlace: "" }]);
    setCount(1);
    toast.success("Đã bắt đầu phiên mới");
  };

  const headerName = useMemo(() => people.map((p) => p.name).filter(Boolean).join(", ") || "Bạn", [people]);

  return (
      <div className="relative min-h-screen">
        <Header />
        <StarField count={50} />

        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-6 text-center">
            <h1 className="font-display text-4xl"><span className="text-gradient-gold">AI Tarot</span> Reader</h1>
            <p className="mt-2 text-sm text-muted-foreground">Trò chuyện cùng AI Tarot — cá nhân hoá theo bản đồ sao. Dữ liệu được mã hoá AES-256.</p>
          </div>

          {stage === "info" && (
              <div className="glass rounded-2xl p-6">
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground">
                  🔐 Ngày sinh được mã hoá end-to-end.
                </div>

                <div className="mb-4">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Số người tham gia
              </span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                        <button
                            key={n}
                            onClick={() => updateCount(n)}
                            className={`flex-1 rounded-lg border py-2 text-sm transition ${
                                count === n ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"
                            }`}
                        >
                          {n} người
                        </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {people.map((p, i) => (
                      <div key={p.id} className="rounded-xl border border-gold/20 bg-background/30 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wider text-gold">Người #{i + 1}</div>
                        <div className="grid gap-3">
                          <Field label="Họ tên" value={p.name} onChange={(v) => updatePerson(i, { name: v })} placeholder="Nguyễn Văn A" />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Ngày sinh" value={p.dob} onChange={(v) => updatePerson(i, { dob: v })} placeholder="DD/MM/YYYY" />
                            <Field label="Giờ sinh" value={p.birthTime} onChange={(v) => updatePerson(i, { birthTime: v })} placeholder="HH:MM" />
                          </div>
                          <Field label="Nơi sinh" value={p.birthPlace} onChange={(v) => updatePerson(i, { birthPlace: v })} placeholder="Hà Nội, Việt Nam" />
                        </div>
                      </div>
                  ))}
                </div>

                <button
                    onClick={goDraw}
                    disabled={loading}
                    className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang kết nối vũ trụ...
                      </>
                  ) : (
                      "✦ Tiếp tục — Rút bài Tarot"
                  )}
                </button>
              </div>
          )}

          {stage === "draw" && (
              <Suspense fallback={<div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Đang chuẩn bị bộ bài…</div>}>
                <DrawStage drawnCards={drawnCards} revealed={revealed} onEnterChat={enterChat} />
              </Suspense>
          )}

          {stage === "chat" && (
              <ChatPanel
                  messages={messages}
                  thinking={thinking}
                  input={input}
                  setInput={setInput}
                  send={send}
                  resetAll={resetAll}
                  headerName={headerName}
                  lastMsgRef={lastMsgRef}
              />
          )}
        </div>
      </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
      <motion.span
          className="block h-1.5 w-1.5 rounded-full bg-gold"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay }}
      />
  );
}

const Bubble = memo(function Bubble({ role, content }: { role: "user" | "ai"; content: string }) {
  return (
      <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
        <div
            className={
              role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-sm text-primary-foreground whitespace-pre-line"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-gold/25 bg-card/60 px-4 py-2.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-line"
            }
        >
          {content}
        </div>
      </div>
  );
});

interface ChatPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  send: (e?: React.FormEvent) => void;
  resetAll: () => void;
  headerName: string;
  lastMsgRef: React.RefObject<HTMLDivElement | null>;
}

const PAGE_SIZE = 30;

function ChatPanel({
                     messages,
                     thinking,
                     input,
                     setInput,
                     send,
                     resetAll,
                     headerName,
                     lastMsgRef,
                   }: ChatPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);

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

  const onSearch = useCallback((v: string) => { setQuery(v); setPage(0); }, []);

  return (
      <div className="glass flex h-[calc(100vh-220px)] min-h-[480px] flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-gold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-base text-gold-soft">Tarot AI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Đang trực tuyến • {headerName}</div>
            </div>
          </div>
          <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10"
          >
            <RotateCcw className="h-3 w-3" /> Phiên mới
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-gold/15 bg-background/30 px-3 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gold/30 bg-input/50 px-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Tìm trong lịch sử chat…"
                className="flex-1 bg-transparent py-1.5 text-xs outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <button
                disabled={pageSafe >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span>{pageSafe + 1}/{totalPages}</span>
            <button
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {view.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Không có tin nhắn nào khớp.</p>}
          {view.map((m, idx) => (
              <div key={m.id} ref={idx === view.length - 1 && pageSafe === 0 ? lastMsgRef : null}>
                <Bubble role={m.role} content={m.content} />
              </div>
          ))}
          {pageSafe === 0 && thinking && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gold/25 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground">
                  <Dot />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                  <span className="ml-1">Đang kết nối năng lượng…</span>
                </div>
              </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-gold/20 bg-background/30 p-3">
          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn cho vũ trụ…"
              className="flex-1 rounded-full border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
          />
          <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Gửi
          </button>
        </form>
      </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-input/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold"
        />
      </label>
  );
}