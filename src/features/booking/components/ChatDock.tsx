import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import type { BookingMessage } from "@/api/booking-chat";
import type { Booking } from "@/api/booking";
import { subscribeDestination } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { useMyBookings, useReaderBookings } from "@/features/booking/queries";
import { BookingChat } from "./BookingChat";

const CHAT_QUEUE = "/user/queue/booking-chat";

/**
 * Cục trao đổi nổi ở góc dưới bên phải.
 *
 * <p>Trước đây muốn biết có tin nhắn mới thì phải vào Lịch hẹn, tìm đúng buổi,
 * rồi bấm "Nhắn tin / Gọi" — tức là phải đoán trước rằng có tin thì mới thấy
 * được tin. Khách nhắn lúc Reader đang ở trang khác thì câu ấy nằm im cho tới
 * khi có người tình cờ mở đúng chỗ.
 *
 * <p>Nghe được ở mọi trang là vì tin chat đi qua hàng đợi RIÊNG của từng người
 * (`/user/queue/booking-chat`) và mang sẵn `bookingId`, chứ không phải một
 * kênh theo từng buổi — nên một chỗ nghe là đủ cho mọi buổi, không cần đăng ký
 * lần lượt và không cần sửa gì ở backend.
 *
 * <p>Mở một cuộc ra thì dựng thẳng [BookingChat], cùng thành phần mà trang
 * Lịch hẹn dùng. Nhờ vậy nút gọi thoại và gọi video có mặt ở đây y như ở kia,
 * và không có hai bản chat để lệch nhau về sau.
 */
export function ChatDock() {
  const { user, can } = useAuth();
  const [moRong, setMoRong] = useState(false);
  const [dangXem, setDangXem] = useState<string | null>(null);
  const [chuaDoc, setChuaDoc] = useState<Record<string, number>>({});

  const laReader = can("READER_MANAGE_PROFILE");
  // Lấy trang đầu là đủ: một buổi còn mở trao đổi thì nó nằm trong những buổi
  // gần nhất, và danh sách này chỉ để CHỌN cuộc chứ không để duyệt lịch sử.
  const cuaToi = useMyBookings({ page: 0, size: 20 }, Boolean(user));
  const cuaReader = useReaderBookings({ page: 0, size: 20 }, laReader);

  const duLieuToi = cuaToi.data;
  const duLieuReader = cuaReader.data;
  const cuoc = useMemo(() => {
    const gop = [
      ...(duLieuToi?.content ?? []).map((b) => ({ b, laKhach: true })),
      ...(duLieuReader?.content ?? []).map((b) => ({ b, laKhach: false })),
    ];
    // `chatOpen` do máy chủ tính (đã trả tiền chưa, còn trong hạn không).
    // Không chép lại luật ấy ở đây — chép là hai nơi sẽ lệch nhau.
    return gop
      .filter(({ b }) => b.chatOpen)
      .sort((x, y) => y.b.startTime.localeCompare(x.b.startTime));
  }, [duLieuToi, duLieuReader]);

  // Đọc trong handler của STOMP nên phải qua ref: handler được đăng ký một
  // lần, còn hai giá trị này đổi liên tục.
  const dangXemRef = useRef<string | null>(null);
  const moRongRef = useRef(false);
  dangXemRef.current = dangXem;
  moRongRef.current = moRong;

  const taiLaiToi = cuaToi.refetch;
  const taiLaiReader = cuaReader.refetch;
  const taiLai = useCallback(() => {
    void taiLaiToi();
    if (laReader) void taiLaiReader();
  }, [taiLaiToi, taiLaiReader, laReader]);

  useEffect(() => {
    if (!user) return;
    return subscribeDestination<BookingMessage>(CHAT_QUEUE, (m) => {
      // Tin của chính mình vọng về thì không phải tin chưa đọc.
      if (m.senderId === user.id) return;
      // Đang mở đúng cuộc đó thì BookingChat lo hiển thị và đánh dấu đã đọc.
      if (moRongRef.current && dangXemRef.current === m.bookingId) return;

      setChuaDoc((truoc) => ({
        ...truoc,
        [m.bookingId]: (truoc[m.bookingId] ?? 0) + 1,
      }));
      // Buổi vừa mở trao đổi có thể chưa có trong danh sách đã tải.
      taiLai();
    });
  }, [user, taiLai]);

  const tong = Object.values(chuaDoc).reduce((a, b) => a + b, 0);

  function mo(id: string) {
    setDangXem(id);
    setChuaDoc((truoc) => {
      if (!truoc[id]) return truoc;
      const sau = { ...truoc };
      delete sau[id];
      return sau;
    });
  }

  if (!user) return null;

  if (!moRong) {
    // Không có cuộc nào mở trao đổi thì ẩn hẳn nút: một nút không bấm được
    // việc gì chỉ chiếm chỗ ở góc màn hình điện thoại.
    if (cuoc.length === 0) return null;
    return (
      <button
        type="button"
        onClick={() => setMoRong(true)}
        aria-label={
          tong > 0 ? `Trao đổi — ${tong} tin chưa đọc` : "Mở khung trao đổi"
        }
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-background/95 text-gold shadow-xl backdrop-blur transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <MessageCircle aria-hidden="true" className="h-6 w-6" />
        {tong > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[22px] place-items-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-background">
            {tong > 9 ? "9+" : tong}
          </span>
        )}
      </button>
    );
  }

  const daChon = cuoc.find(({ b }) => b.id === dangXem);

  return (
    /* inset-x-3 trên màn hẹp: khung rộng 380px tràn ra ngoài mép điện thoại
       320px, và phần tràn là cột bên phải — tức là đúng chỗ đặt nút gửi. */
    <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]">
      <div className="panel-black flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-gold/25 shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2.5">
          {daChon ? (
            <button
              type="button"
              onClick={() => setDangXem(null)}
              className="min-w-0 truncate text-left text-sm text-gold hover:underline"
            >
              ‹ {tenDoiPhuong(daChon.b, daChon.laKhach)}
            </button>
          ) : (
            <p className="text-sm text-foreground">Trao đổi</p>
          )}
          <button
            type="button"
            onClick={() => setMoRong(false)}
            aria-label="Thu nhỏ khung trao đổi"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>

        {daChon ? (
          <div className="flex min-h-[340px] flex-1 flex-col overflow-hidden">
            <BookingChat
              gonGang
              bookingId={daChon.b.id}
              peerLabel={tenDoiPhuong(daChon.b, daChon.laKhach)}
            />
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {cuoc.map(({ b, laKhach }) => (
              <li key={`${b.id}-${laKhach ? "k" : "r"}`}>
                <button
                  type="button"
                  onClick={() => mo(b.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-mystic/15"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">
                      {tenDoiPhuong(b, laKhach)}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {laKhach ? "Bạn đặt" : "Khách đặt với bạn"} ·{" "}
                      {ngayGio(b.startTime)}
                    </span>
                  </span>
                  {chuaDoc[b.id] ? (
                    <span className="grid min-w-[20px] shrink-0 place-items-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-background">
                      {chuaDoc[b.id]}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Tên người BÊN KIA: khách thì thấy Reader, Reader thì thấy khách. */
function tenDoiPhuong(b: Booking, laKhach: boolean) {
  return laKhach ? b.readerName : b.customerName;
}

function ngayGio(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
