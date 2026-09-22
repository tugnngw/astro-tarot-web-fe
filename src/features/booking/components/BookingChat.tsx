// Hộp nhắn tin giữa khách và Reader trong một buổi đã đặt.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Wifi, WifiOff, Video, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  getMessages,
  markMessagesRead,
  sendBookingMessage,
  type BookingMessage,
} from "@/api/booking-chat";
import {
  subscribeDestination,
  subscribeRealtimeStatus,
} from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { CallPanel } from "./CallPanel";
import { useBookingCall } from "../hooks/useBookingCall";

const CHAT_QUEUE = "/user/queue/booking-chat";
const ERROR_QUEUE = "/user/queue/errors";

function gio(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function BookingChat({
  bookingId,
  peerLabel,
}: {
  bookingId: string;
  /** "Reader" hay tên khách — chỉ để ghi tiêu đề. */
  peerLabel: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const cuoiDanh = useRef<HTMLDivElement>(null);

  const call = useBookingCall(bookingId);

  // Lịch sử: BE trả mới-nhất-trước cho tiện phân trang, màn hình cần ngược lại.
  useEffect(() => {
    let huy = false;
    setLoading(true);
    void getMessages(bookingId, 0, 50)
      .then((page) => {
        if (huy) return;
        setMessages([...page.content].reverse());
      })
      .catch(() => {
        if (!huy) toast.error("Không tải được tin nhắn cũ");
      })
      .finally(() => {
        if (!huy) setLoading(false);
      });
    return () => {
      huy = true;
    };
  }, [bookingId]);

  // Tin mới qua WebSocket.
  useEffect(() => {
    const off = subscribeDestination<BookingMessage>(CHAT_QUEUE, (m) => {
      if (!m || m.bookingId !== bookingId) return;
      setMessages((truoc) =>
        // Máy chủ đẩy cho cả người gửi, nên cùng một tin có thể tới hai lần
        // nếu người dùng mở hai tab. Lọc theo id thay vì tin là không trùng.
        truoc.some((x) => x.id === m.id) ? truoc : [...truoc, m],
      );
    });
    return off;
  }, [bookingId]);

  // Lỗi gửi tin do máy chủ báo về (quá hạn, chưa thanh toán, quá dài…).
  useEffect(() => {
    const off = subscribeDestination<{ scope: string; message: string }>(
      ERROR_QUEUE,
      (e) => {
        if (e?.scope === "CHAT") toast.error(e.message);
      },
    );
    return off;
  }, []);

  useEffect(() => subscribeRealtimeStatus(setOnline), []);

  // Đánh dấu đã đọc khi mở và mỗi khi có tin mới của phía kia.
  useEffect(() => {
    void markMessagesRead(bookingId).catch(() => {
      // Không đọc được dấu đã xem không đáng làm phiền người dùng.
    });
  }, [bookingId, messages.length]);

  useEffect(() => {
    cuoiDanh.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const guiDi = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const body = draft.trim();
      if (!body || sending) return;
      setSending(true);
      try {
        const { viaSocket } = await sendBookingMessage(bookingId, body);
        setDraft("");
        if (!viaSocket) {
          toast.message("Đã gửi qua đường dự phòng", {
            description: "Kết nối tức thời đang chập chờn.",
          });
          const page = await getMessages(bookingId, 0, 50);
          setMessages([...page.content].reverse());
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không gửi được");
      } finally {
        setSending(false);
      }
    },
    [bookingId, draft, sending],
  );

  const coTheGoi = call.state === "idle";
  const nhom = useMemo(() => messages, [messages]);

  return (
    <section className="glass flex h-[32rem] flex-col rounded-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg">Trao đổi với {peerLabel}</h3>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {online ? (
              <>
                <Wifi aria-hidden className="h-3 w-3 text-emerald-400" />
                Đang kết nối tức thời
              </>
            ) : (
              <>
                <WifiOff aria-hidden className="h-3 w-3 text-amber-400" />
                Mất kết nối tức thời — tin vẫn gửi được, chỉ chậm hơn
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void call.start(false)}
            disabled={!coTheGoi}
            title="Gọi thoại"
            className="rounded-full border border-gold/30 p-2 text-gold disabled:opacity-40"
          >
            <Phone aria-hidden className="h-4 w-4" />
            <span className="sr-only">Gọi thoại</span>
          </button>
          <button
            type="button"
            onClick={() => void call.start(true)}
            disabled={!coTheGoi}
            title="Gọi video"
            className="rounded-full border border-gold/30 p-2 text-gold disabled:opacity-40"
          >
            <Video aria-hidden className="h-4 w-4" />
            <span className="sr-only">Gọi video</span>
          </button>
        </div>
      </header>

      <CallPanel call={call} />

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Đang tải…</p>
        ) : nhom.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có tin nhắn nào. Nhắn một câu để bắt đầu.
          </p>
        ) : (
          nhom.map((m) => {
            const cuaToi = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${cuaToi ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    cuaToi
                      ? "bg-gold/20 text-foreground"
                      : "bg-mystic/15 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    {gio(m.createdAt)}
                    {cuaToi && m.readAt ? " · đã xem" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={cuoiDanh} />
      </div>

      <form
        onSubmit={guiDi}
        className="flex items-end gap-2 border-t border-white/5 p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter gửi, Shift+Enter xuống dòng — thói quen của mọi ứng dụng chat.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void guiDi(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Nhắn gì đó…"
          aria-label="Nội dung tin nhắn"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-y rounded-xl border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="rounded-xl bg-gold px-3 py-2 text-background disabled:opacity-40"
        >
          <Send aria-hidden className="h-4 w-4" />
          <span className="sr-only">Gửi</span>
        </button>
      </form>
    </section>
  );
}
