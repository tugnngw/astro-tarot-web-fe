// Hộp nhắn tin giữa khách và Reader trong một buổi đã đặt.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Smile, WifiOff, Video, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  getMessages,
  getPresence,
  markMessagesRead,
  sendBookingMessage,
  type BookingMessage,
  type Presence,
} from "@/api/booking-chat";
import { subscribeDestination, subscribeRealtimeStatus } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { moTaHoatDong } from "../hoatDong";
import { CallPanel } from "./CallPanel";
import { BangEmote } from "./BangEmote";
import { useBookingCall } from "../hooks/useBookingCall";

const CHAT_QUEUE = "/user/queue/booking-chat";
const ERROR_QUEUE = "/user/queue/errors";

/**
 * Không nhận rỗng: new Date(null) KHÔNG phải Invalid Date mà là mốc 1970, nên
 * nó lọt qua chốt isNaN ngay dưới và vẽ ra "08:00 01-01" — chuỗi từng hiện
 * thật trên production khi máy chủ đẩy tin thiếu createdAt. Thà không có dấu
 * thời gian còn hơn có một cái sai.
 */
function gio(iso: string | null | undefined) {
  if (!iso) return "";
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

/**
 * Khung tin có đang cuộn ở gần đáy không.
 *
 * <p>Quyết định một tin mới tới thì có kéo người dùng xuống hay không. Ai đó
 * cuộn lên đọc lại tin cũ mà bị kéo về đáy thì họ mất chỗ đang đọc và không
 * hiểu vì sao — nên chỉ tự cuộn khi họ vốn đã ở dưới cùng.
 *
 * <p>Ngưỡng 80px: đủ rộng để lệch một dòng tin không bị tính là "đã đi chỗ
 * khác", đủ hẹp để người đang đọc giữa danh sách không bị coi là ở đáy.
 *
 * <p>Xuất ra để kiểm được — đây là hàm thuần trên ba con số, và nó là chỗ duy
 * nhất quyết định hành vi ấy.
 */
export function dangOGanDay(el: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

export function BookingChat({
  bookingId,
  peerLabel,
  peerAvatar = null,
  gonGang = false,
}: {
  bookingId: string;
  /** "Reader" hay tên khách — chỉ để ghi tiêu đề. */
  peerLabel: string;
  peerAvatar?: string | null;
  /**
   * Dạng gọn, dùng khi nhúng trong cục trao đổi nổi.
   *
   * Bỏ chiều cao cố định (khung ngoài đã kẹp rồi, giữ thêm một con số cứng ở
   * đây là tràn trên màn thấp) và bỏ dòng tiêu đề — khung ngoài đã ghi tên
   * người bên kia, ghi lại thành hai dòng giống nhau chồng lên nhau.
   *
   * KHÔNG bỏ dòng trạng thái kết nối và hai nút gọi: đó là lý do người ta mở
   * khung này ra.
   */
  gonGang?: boolean;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [hienDien, setHienDien] = useState<Presence | null>(null);
  const [emoteMo, setEmoteMo] = useState(false);
  const khungTin = useRef<HTMLDivElement>(null);
  const oNhap = useRef<HTMLTextAreaElement>(null);
  const oForm = useRef<HTMLFormElement>(null);
  /**
   * Người dùng có đang ở gần đáy không, đo NGAY TRƯỚC khi danh sách đổi.
   *
   * Ai đó cuộn lên đọc lại tin cũ thì một tin mới tới không được kéo họ về
   * đáy — họ mất chỗ đang đọc và không biết vì sao.
   */
  const gapDay = useRef(true);

  const call = useBookingCall(bookingId);

  useEffect(() => {
    if (!emoteMo) return;
    const tat = (e: MouseEvent) => {
      if (oForm.current?.contains(e.target as Node)) return;
      setEmoteMo(false);
    };
    const phim = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEmoteMo(false);
    };
    document.addEventListener("mousedown", tat);
    window.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("mousedown", tat);
      window.removeEventListener("keydown", phim);
    };
  }, [emoteMo]);

  function chenEmote(ky: string) {
    const el = oNhap.current;
    setDraft((cu) => {
      const dau = el?.selectionStart ?? cu.length;
      const cuoi = el?.selectionEnd ?? dau;
      const sau = (cu.slice(0, dau) + ky + cu.slice(cuoi)).slice(0, 4000);
      const cho = Math.min(dau + ky.length, sau.length);
      queueMicrotask(() => {
        el?.focus();
        el?.setSelectionRange(cho, cho);
      });
      return sau;
    });
  }

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

  // Hỏi lại định kỳ thay vì đẩy realtime.
  //
  // Đẩy thì phải tìm ra ai đang mở hội thoại với người vừa đổi trạng thái —
  // một truy vấn cho mỗi lần bất kỳ ai nối hay rớt, mà STOMP rớt rồi nối lại
  // là chuyện hằng ngày trên gói free của Render.
  //
  // 30 giây: đủ nhanh để "đang hoạt động" còn có nghĩa, đủ chậm để không
  // thành một vòng gọi API suốt thời gian khung chat mở.
  useEffect(() => {
    let daRoi = false;
    const tai = () => {
      void getPresence(bookingId)
        .then((p) => {
          if (!daRoi) setHienDien(p);
        })
        .catch(() => {
          // Không biết trạng thái thì giấu dòng ấy đi, đừng làm phiền bằng
          // một câu lỗi về một chi tiết phụ.
          if (!daRoi) setHienDien(null);
        });
    };
    tai();
    const hen = setInterval(tai, 30_000);
    return () => {
      daRoi = true;
      clearInterval(hen);
    };
  }, [bookingId]);

  // Đánh dấu đã đọc khi mở và mỗi khi có tin mới của phía kia.
  useEffect(() => {
    void markMessagesRead(bookingId).catch(() => {
      // Không đọc được dấu đã xem không đáng làm phiền người dùng.
    });
  }, [bookingId, messages.length]);

  /*
   * Cuộn KHUNG TIN, không phải cả trang.
   *
   * Trước đây chỗ này kéo một thẻ mốc ở cuối danh sách vào tầm nhìn. Hàm ấy
   * cuộn MỌI khung cha cuộn được cho tới khi thẻ mốc hiện ra — kể cả chính
   * cửa sổ trình duyệt. Nên mỗi lần gửi một tin, cả trang giật lên: ô nhập
   * biến khỏi chỗ ngón tay vừa bấm, và tiêu đề lịch hẹn trôi mất.
   *
   * Đặt thẳng `scrollTop` thì chỉ đúng một khung di chuyển.
   */
  useEffect(() => {
    const box = khungTin.current;
    if (!box || !gapDay.current) return;
    box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  const guiDi = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const body = draft.trim();
      if (!body || sending) return;
      // Tự mình gửi thì LUÔN về đáy, kể cả đang đọc dở tin cũ ở trên: gửi một
      // câu rồi không thấy nó đâu là tưởng gửi hỏng.
      gapDay.current = true;
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
  const moTa = moTaHoatDong(hienDien);
  const nhom = useMemo(() => messages, [messages]);

  return (
    <section
      className={`flex flex-col bg-black ${
        gonGang ? "min-h-0 flex-1 rounded-none" : "glass h-[32rem] rounded-2xl"
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-gold px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {!gonGang && (
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#3a3b3c] text-sm font-semibold text-white">
              {peerAvatar ? (
                <img
                  src={peerAvatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                peerLabel.charAt(0).toUpperCase()
              )}
            </span>
          )}
          <div className="min-w-0">
          {!gonGang && (
            <h3 className="truncate font-display text-lg">
              Trao đổi với {peerLabel}
            </h3>
          )}
          {/*
            Dòng này nói về NGƯỜI BÊN KIA, không phải về kết nối của mình.

            Trước đây chỗ này hiện "Đang kết nối tức thời" kèm một chấm xanh —
            tức là trạng thái socket của CHÍNH MÌNH. Nó trông y hệt một chỉ
            báo có mặt, nên người dùng đọc thành "Reader đang online" và ngồi
            chờ trả lời từ một người đã đi ngủ.

            Kết nối của mình chỉ đáng nói khi nó ĐỨT, vì lúc ấy mới có việc
            phải làm. Còn chạy tốt thì im lặng.
          */}
          {moTa && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${
                  hienDien?.online ? "bg-emerald-400" : "bg-muted-foreground/40"
                }`}
              />
              {moTa}
            </p>
          )}
          {!online && (
            <p className="flex items-center gap-1 text-[11px] text-amber-300">
              <WifiOff aria-hidden className="h-3 w-3 shrink-0" />
              Mất kết nối tức thời — tin vẫn gửi được, chỉ chậm hơn
            </p>
          )}
          </div>
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

      <div
        ref={khungTin}
        onScroll={(e) => {
          gapDay.current = dangOGanDay(e.currentTarget);
        }}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Đang tải…
          </p>
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
                className={`flex items-end gap-2 ${cuaToi ? "justify-end" : "justify-start"}`}
              >
                {!cuaToi && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#3a3b3c] text-xs font-semibold text-white">
                    {peerAvatar ? (
                      <img
                        src={peerAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      peerLabel.charAt(0).toUpperCase()
                    )}
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    cuaToi
                      ? "rounded-br-md bg-[#0084ff] text-white"
                      : "rounded-bl-md bg-[#3a3b3c] text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-1 text-right text-[10px] text-white/60">
                    {gio(m.createdAt)}
                    {cuaToi && m.readAt ? " · đã xem" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        ref={oForm}
        onSubmit={guiDi}
        className="relative mx-3 mb-3 mt-2 flex h-12 shrink-0 items-center rounded-full border border-gold/70 bg-black pl-4 pr-1"
      >
        {emoteMo && <BangEmote onChon={chenEmote} />}
        <textarea
          ref={oNhap}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter gửi. Không còn nút gửi.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void guiDi(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Nhắn gì đó…"
          aria-label="Nội dung tin nhắn"
          className="h-10 min-h-0 flex-1 resize-none overflow-hidden bg-transparent text-sm leading-10 outline-none"
        />
        <button
          type="button"
          onClick={() => setEmoteMo((v) => !v)}
          aria-expanded={emoteMo}
          aria-label="Biểu cảm"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gold hover:bg-white/10"
        >
          <Smile aria-hidden className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
