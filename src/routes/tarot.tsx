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
import { startAiTarotReading, type TarotReadingResult } from "@/api/tarot";
import { createAstrologyProfile, type CreateAstrologyProfileRequest } from "@/api/astrology";
import {convertToISODate, convertToISOTime, getUserTimezone} from "@/lib/utils";

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
  const { user, openAuth } = useAuth();
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [readingResult, setReadingResult] = useState<TarotReadingResult | null>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);

  // Load history - chỉ khi đã đăng nhập
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setReadingResult(null);
      setDrawnCards([]);
      setStage("info");
      return;
    }

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
  }, [uid, user]);

  // Persist - chỉ khi đã đăng nhập và đang ở stage chat
  useEffect(() => {
    if (stage === "chat" && user) {
      localStorage.setItem(storageKey(uid), JSON.stringify({ messages, people, drawnCards, readingResult }));
    }
  }, [messages, stage, uid, people, drawnCards, readingResult, user]);

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
  // RÚT BÀI + LƯU PROFILE CHIÊM TINH
  // ============================================================
  const goDraw = async () => {
    // Kiểm tra đã đăng nhập
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng Tarot AI");
      openAuth("login");
      return;
    }

    // Validation
    for (const p of people) {
      if (!p.name.trim()) {
        toast.error("Vui lòng nhập họ tên cho tất cả mọi người.");
        return;
      }
      if (!p.dob.trim()) {
        toast.error(`Vui lòng nhập ngày sinh cho ${p.name}.`);
        return;
      }
    }

    setLoading(true);
    setSavingProfile(true);

    try {
      const primaryPerson = people[0];

      // ============================================================
      // CONVERT DATE VÀ TIME ĐÚNG FORMAT
      // ============================================================
      const birthDateISO = convertToISODate(primaryPerson.dob);
      const birthTimeISO = convertToISOTime(primaryPerson.birthTime);

      console.log("📅 Original date:", primaryPerson.dob);
      console.log("📅 ISO date:", birthDateISO);
      console.log("🕐 Original time:", primaryPerson.birthTime);
      console.log("🕐 ISO time:", birthTimeISO);

      // Kiểm tra date hợp lệ
      if (!birthDateISO || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)) {
        toast.error("Ngày sinh không hợp lệ. Vui lòng nhập định dạng DD/MM/YYYY (ví dụ: 04/10/2000)");
        setLoading(false);
        setSavingProfile(false);
        return;
      }

      // ============================================================
      // BƯỚC 1: Lưu thông tin chiêm tinh
      // ============================================================
      try {
        const profileData = {
          title: `Profile của ${primaryPerson.name}`,
          targetName: primaryPerson.name,
          birthDate: birthDateISO,
          birthTime: birthTimeISO,  // Đã convert sang HH:mm:ss hoặc undefined
          birthPlace: primaryPerson.birthPlace || "Chưa xác định",
          latitude: 0,
          longitude: 0,
          timezone: getUserTimezone(),
          profileType: "SELF" as const,
          isPrimary: true,
        };

        console.log("📝 Sending profile data:", profileData);

        const savedProfile = await createAstrologyProfile(profileData);
        console.log("✅ Profile saved:", savedProfile);
        toast.success("📊 Đã lưu thông tin chiêm tinh!");
      } catch (profileError: any) {
        console.warn("⚠️ Could not save profile:", profileError);
        // Nếu lỗi 409 (đã tồn tại), vẫn tiếp tục
        if (profileError?.status === 409 || profileError?.message?.includes("already exists")) {
          toast.info("📊 Đã có thông tin chiêm tinh, tiếp tục rút bài!");
        } else {
          toast.warning("Không thể lưu thông tin chiêm tinh, nhưng vẫn có thể rút bài.");
        }
      } finally {
        setSavingProfile(false);
      }

      // ============================================================
      // BƯỚC 2: Rút bài Tarot
      // ============================================================
      const result = await startAiTarotReading({
        question: `Xin chào, tôi là ${primaryPerson.name}, sinh ngày ${primaryPerson.dob}.`,
        numberOfCards: 3,
        includeReversed: true,
        spreadName: "Past-Present-Future",
      });

      setReadingResult(result);
      const cardNames = result.drawnCards.map(c => c.cardName);
      setDrawnCards(cardNames);
      setRevealed(false);
      setStage("draw");
      setTimeout(() => setRevealed(true), 500);
      toast.success("✨ Đã rút bài thành công!");

    } catch (error: any) {
      console.error("Tarot API error:", error);

      if (error?.message?.includes("503") || error?.message?.includes("high demand")) {
        toast.error("🔮 Dịch vụ Tarot AI đang quá tải. Vui lòng thử lại sau vài phút.");
      } else if (error?.message?.includes("Network error")) {
        toast.error("🌐 Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.");
      } else {
        toast.error(error?.message || "Không thể rút bài, vui lòng thử lại");
      }

      // Fallback to mock
      const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5).slice(0, 3);
      setDrawnCards(shuffled);
      setRevealed(false);
      setStage("draw");
      setTimeout(() => setRevealed(true), 500);

    } finally {
      setLoading(false);
      setSavingProfile(false);
    }
  };

  // ============================================================
  // VÀO CHAT
  // ============================================================
  const enterChat = () => {
    if (readingResult) {
      const cardLines = readingResult.drawnCards.map((c, i) => {
        const positions = ["Quá khứ", "Hiện tại", "Tương lai"];
        const status = c.reversed ? '🔄 Đảo ngược' : '⬆️ Xuôi';
        return `📌 **${positions[i] || i+1}**: ${c.cardName} — ${status}`;
      }).join('\n');

      const welcomeMessage = `✨ **Xin chào! Tôi là Tarot AI** ✨\n\nTôi đã rút bài cho bạn. Đây là 3 lá bài của bạn:\n\n${cardLines}\n\n---\n\n📖 **Điều Tarot muốn nói với bạn:**\n\n${readingResult.aiInterpretation}\n\n---\n\n💫 Bạn có thắc mắc gì về bài đọc này không? Hãy hỏi tôi nhé!`;

      setMessages([{
        id: "welcome",
        role: "ai",
        content: welcomeMessage,
        ts: Date.now(),
      }]);
    } else {
      // Fallback mock
      const intro = people.map((p) => `${p.name} (${p.dob})`).join(", ");
      const cardLines = drawnCards.map((c, i) =>
          `📌 **${["Quá khứ", "Hiện tại", "Tương lai"][i]}**: ${c}`
      ).join('\n');

      setMessages([{
        id: "welcome",
        role: "ai",
        content: `✨ **Xin chào ${intro}!** ✨\n\nTôi đã rút 3 lá bài cho bạn:\n\n${cardLines}\n\n---\n\n📖 **Thông điệp từ các lá bài:**\n\n${drawnCards.map((c, i) =>
            `**${["Quá khứ", "Hiện tại", "Tương lai"][i]}**: ${getCardMeaning(c)}`
        ).join('\n\n')}\n\n---\n\n💫 Hãy chia sẻ điều bạn đang băn khoăn nhé!`,
        ts: Date.now(),
      }]);
    }
    setStage("chat");
  };

  // ============================================================
  // GỬI TIN NHẮN
  // ============================================================
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() }]);
    setInput("");
    setThinking(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    setMessages((m) => [...m, {
      id: crypto.randomUUID(),
      role: "ai",
      content: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
      ts: Date.now()
    }]);
    setThinking(false);
  };

  // ============================================================
  // RESET
  // ============================================================
  const resetAll = () => {
    if (user) {
      localStorage.removeItem(storageKey(uid));
    }
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
      <div className="relative min-h-screen">
        <Header />
        <StarField count={50} />

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 text-center">
            <h1 className="font-display text-3xl"><span className="text-gradient-gold">AI Tarot</span> Reader</h1>
            <p className="mt-1 text-sm text-muted-foreground">Trò chuyện cùng AI Tarot — cá nhân hoá theo bản đồ sao</p>
            {!user && (
                <button
                    onClick={() => openAuth("login")}
                    className="mt-2 text-xs text-gold hover:underline"
                >
                  🔐 Đăng nhập để lưu lịch sử
                </button>
            )}
          </div>

          {stage === "info" && (
              <div className="glass rounded-2xl p-6 max-w-3xl mx-auto">
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
                          <Field
                              label="Họ tên"
                              value={p.name}
                              onChange={(v) => updatePerson(i, { name: v })}
                              placeholder="Nguyễn Văn A"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Field
                                label="Ngày sinh"
                                value={p.dob}
                                onChange={(v) => updatePerson(i, { dob: v })}
                                placeholder="DD/MM/YYYY (vd: 04/10/2000)"
                            />
                            <Field
                                label="Giờ sinh"
                                value={p.birthTime}
                                onChange={(v) => updatePerson(i, { birthTime: v })}
                                placeholder="HH:MM (vd: 09:00 hoặc 900)"
                            />
                          </div>
                          <Field
                              label="Nơi sinh"
                              value={p.birthPlace}
                              onChange={(v) => updatePerson(i, { birthPlace: v })}
                              placeholder="Hà Nội, Việt Nam"
                          />
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
                        {savingProfile ? "Đang lưu thông tin chiêm tinh..." : "Đang kết nối vũ trụ..."}
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
              <div className="w-full">
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
              </div>
          )}
        </div>
      </div>
  );
}

// ============================================================
// CHAT PANEL
// ============================================================
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

const PAGE_SIZE = 50;

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
      <div className="glass flex h-[calc(100vh-160px)] min-h-[520px] w-full flex-col overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-3 bg-background/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-gold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-1 ring-background"></span>
            </div>
            <div>
              <div className="font-display text-base text-gold-soft">Tarot AI</div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Đang trực tuyến • {headerName}
              </div>
            </div>
          </div>
          <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 hover:border-gold"
          >
            <RotateCcw className="h-3 w-3" /> Phiên mới
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border-b border-gold/15 bg-background/30 px-3 py-2 shrink-0">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gold/30 bg-input/50 px-3 focus-within:border-gold/70 transition-colors">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Tìm trong lịch sử chat…"
                className="flex-1 bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <button
                disabled={pageSafe >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="min-w-[40px] text-center text-xs">
            {pageSafe + 1}/{totalPages}
          </span>
            <button
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30 transition"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gradient-to-b from-background/10 to-background/5 min-h-[300px]">
          {view.length === 0 && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn nào</p>
                <p className="text-xs text-muted-foreground/60">Hãy đặt câu hỏi để bắt đầu</p>
              </div>
          )}
          {view.map((m, idx) => (
              <div
                  key={m.id}
                  ref={idx === view.length - 1 && pageSafe === 0 ? lastMsgRef : null}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Bubble role={m.role} content={m.content} />
              </div>
          ))}
          {pageSafe === 0 && thinking && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gold/25 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="ml-1 text-xs">Đang suy ngẫm...</span>
                </div>
              </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex gap-2 border-t border-gold/20 bg-background/30 p-3 shrink-0">
          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn cho vũ trụ…"
              className="flex-1 rounded-full border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-muted-foreground/60"
          />
          <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>
      </div>
  );
}

// ============================================================
// BUBBLE
// ============================================================
const Bubble = memo(function Bubble({ role, content }: { role: "user" | "ai"; content: string }) {
  const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

  return (
      <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-3`}>
        <div
            className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                role === "user"
                    ? "rounded-2xl rounded-br-sm bg-gold text-primary-foreground"
                    : "rounded-2xl rounded-bl-sm border border-gold/20 bg-card/80 text-foreground/90"
            }`}
        >
          <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
      </div>
  );
});

// ============================================================
// FIELD
// ============================================================
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