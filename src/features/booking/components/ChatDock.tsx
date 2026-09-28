import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { getMessages, type BookingMessage } from "@/api/booking-chat";
import { deCuocCho, type TinHieuGoi } from "../cuocCho";
import { maBuoi, phiaCua, type Notification } from "@/api/notifications";
import type { Booking } from "@/api/booking";
import { subscribeDestination, subscribeRealtimeEvents } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import { useMyBookings, useReaderBookings } from "@/features/booking/queries";
import { LopPhu } from "@/components/GocNoi";
import { dangKyMoChat } from "../moKhungChat";
import { BookingChat } from "./BookingChat";

const CHAT_QUEUE = "/user/queue/booking-chat";
const CALL_QUEUE = "/user/queue/booking-call";

/**
 * Buổi mà KHÁCH vừa trả tiền xong, hoặc null nếu tin này không phải chuyện đó.
 *
 * <p>Trả tiền xong là lúc người ta muốn nói chuyện ngay: xác nhận lại giờ, hỏi
 * cần chuẩn bị gì, gửi trước câu hỏi muốn xem. Bắt họ tự mò vào Lịch hẹn rồi
 * tìm đúng buổi rồi bấm mở trao đổi là ba bước cho một việc mà họ vừa mới trả
 * tiền để được làm.
 *
 * <p>Nghe theo THÔNG BÁO chứ không theo đường dẫn trả về từ cổng thanh toán:
 * tiền có thể được xác nhận bằng webhook PayOS hoặc bằng tay do quản trị viên
 * đối soát, và chỉ đường thứ nhất mới đưa người dùng quay lại một URL. Nghe ở
 * đây thì cả hai đường đều chạy.
 *
 * <p>Chỉ mở cho phía KHÁCH. Reader cũng nhận một tin PAYMENT_CONFIRMED cho
 * cùng buổi ấy, nhưng bật khung chat lên giữa lúc họ đang làm việc khác là
 * chen ngang — họ đã có chấm đếm tin chưa đọc rồi.
 */
export function buoiKhachVuaTraTien(n: Notification | null): string | null {
  if (!n || n.type !== "PAYMENT_CONFIRMED") return null;
  if (phiaCua(n.metadata) !== "customer") return null;
  return maBuoi(n.metadata);
}

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
  const [xemTruoc, setXemTruoc] = useState<
    Record<string, { body: string; at: string; senderId: string }>
  >({});
  const [tim, setTim] = useState("");
  const [loc, setLoc] = useState<"tat-ca" | "chua-doc">("tat-ca");
  // Đọc trong handler của STOMP nên phải qua ref: handler được đăng ký một
  // lần, còn hai giá trị này đổi liên tục.
  const moRongRef = useRef(moRong);
  const dangXemRef = useRef(dangXem);
  moRongRef.current = moRong;
  dangXemRef.current = dangXem;

  useEffect(() => {
    return dangKyMoChat((id) => {
      setDangXem(id);
      setMoRong(true);
    });
  }, []);

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

      setXemTruoc((truoc) => ({
        ...truoc,
        [m.bookingId]: {
          body: m.body,
          at: m.createdAt || new Date().toISOString(),
          senderId: m.senderId,
        },
      }));
      setChuaDoc((truoc) => ({
        ...truoc,
        [m.bookingId]: (truoc[m.bookingId] ?? 0) + 1,
      }));
      // Buổi vừa mở trao đổi có thể chưa có trong danh sách đã tải.
      taiLai();
    });
  }, [user, taiLai]);

  // Lời mời gọi có thể tới lúc khung chat đang đóng. Giữ lại rồi mở đúng buổi,
  // hộp chat của buổi đó lấy lời mời và hiện chuông giữa màn hình.
  useEffect(() => {
    if (!user) return;
    return subscribeDestination<TinHieuGoi>(CALL_QUEUE, (tin) => {
      if (!tin || tin.type !== "OFFER" || !tin.bookingId) return;
      // Hộp chat đang mở thì chính nó nghe lời mời. Giữ thêm ở đây sẽ reo lần nữa
      // khi người ta đóng rồi mở lại cuộc ấy.
      if (moRongRef.current && dangXemRef.current === tin.bookingId) return;
      deCuocCho(tin);
      setDangXem(tin.bookingId);
      setMoRong(true);
    });
  }, [user]);

  // Trả tiền xong thì mở thẳng cuộc với Reader đó ra.
  //
  // `chatOpen` bên máy chủ vừa chuyển sang true đúng lúc này, nên buổi ấy chưa
  // có trong danh sách đã tải — phải tải lại trước. Trong lúc chờ, khung hiện
  // danh sách rồi tự nhảy sang đúng cuộc khi dữ liệu về.
  useEffect(() => {
    if (!user) return;
    return subscribeRealtimeEvents((e) => {
      const id = buoiKhachVuaTraTien(e?.notification ?? null);
      if (!id) return;
      taiLai();
      setDangXem(id);
      setMoRong(true);
    });
  }, [user, taiLai]);

  const tong = Object.values(chuaDoc).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!moRong || dangXem) return;
    let huy = false;
    for (const { b } of cuoc) {
      void getMessages(b.id, 0, 1)
        .then((trang) => {
          const m = trang.content[0];
          if (!m || huy) return;
          setXemTruoc((truoc) => {
            const cu = truoc[b.id];
            if (cu && cu.at >= m.createdAt) return truoc;
            return {
              ...truoc,
              [b.id]: { body: m.body, at: m.createdAt, senderId: m.senderId },
            };
          });
        })
        .catch(() => {
          // Không có tin thì dòng phụ vẫn hiện giờ hẹn.
        });
    }
    return () => {
      huy = true;
    };
  }, [moRong, dangXem, cuoc]);

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
        /* Vị trí do <GocNoi> quyết định — nút này đứng cùng cột với nút
           Góp ý. `relative` để cái huy hiệu đếm tin bám vào nút. */
        className="relative grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-background/95 text-gold shadow-xl backdrop-blur transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
  const tu = tim.trim().toLowerCase();
  const danhSach = gopTheoNguoi(cuoc)
    .map((nhom) => ({
      ...nhom,
      buoi: [...nhom.buoi].sort((x, y) => {
        const ax = xemTruoc[x.b.id]?.at ?? x.b.startTime;
        const ay = xemTruoc[y.b.id]?.at ?? y.b.startTime;
        return ay.localeCompare(ax);
      }),
    }))
    .filter((nhom) => {
      const coChuaDoc = nhom.buoi.some(({ b }) => chuaDoc[b.id]);
      if (loc === "chua-doc" && !coChuaDoc) return false;
      if (!tu) return true;
      return nhom.ten.toLowerCase().includes(tu);
    })
    .sort((x, y) => {
      const ax = xemTruoc[x.buoi[0].b.id]?.at ?? x.buoi[0].b.startTime;
      const ay = xemTruoc[y.buoi[0].b.id]?.at ?? y.buoi[0].b.startTime;
      return ay.localeCompare(ax);
    });

  return (
    /* Đẩy ra khỏi cột nút: khung này phủ cả góc màn hình, để trong cột thì nó
       kéo giãn chính cái cột đang giữ nút Góp ý.

       inset-x-3 trên màn hẹp: khung rộng 380px tràn ra ngoài mép điện thoại
       320px, và phần tràn là cột bên phải — tức là đúng chỗ đặt nút gửi.

       z-50 chứ không phải z-40: lúc mở ra nó nằm chồng đúng lên chỗ nút Góp
       ý, và nút ấy phải nằm dưới chứ không thò ra giữa khung chat. */
    <LopPhu>
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:right-4 sm:w-[420px]">
        <div className="flex h-[min(100dvh,760px)] flex-col overflow-hidden rounded-t-2xl border border-gold/35 bg-black text-white shadow-2xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3">
            {daChon ? (
              <button
                type="button"
                onClick={() => setDangXem(null)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <Anh
                  src={anhDoiPhuong(daChon.b, daChon.laKhach)}
                  ten={tenDoiPhuong(daChon.b, daChon.laKhach)}
                  nho
                />
                <span className="truncate text-[15px] font-semibold">
                  {tenDoiPhuong(daChon.b, daChon.laKhach)}
                </span>
              </button>
            ) : (
              <p className="text-2xl font-bold tracking-tight">Đoạn chat</p>
            )}
            <button
              type="button"
              onClick={() => setMoRong(false)}
              aria-label="Thu nhỏ khung trao đổi"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {daChon ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CacBuoi
                dangXem={daChon.b.id}
                buoi={cuoc.filter(
                  (c) =>
                    c.laKhach === daChon.laKhach &&
                    (c.laKhach
                      ? c.b.readerUserId === daChon.b.readerUserId
                      : c.b.customerId === daChon.b.customerId),
                )}
                onChon={mo}
              />
              <BookingChat
                gonGang
                bookingId={daChon.b.id}
                peerLabel={tenDoiPhuong(daChon.b, daChon.laKhach)}
                peerAvatar={anhDoiPhuong(daChon.b, daChon.laKhach)}
              />
            </div>
          ) : (
            <>
              <div className="px-3 pb-2">
                <label className="flex items-center gap-2 rounded-full bg-[#3a3b3c] px-3 py-2 text-sm text-white/80">
                  <Search aria-hidden className="h-4 w-4 shrink-0" />
                  <input
                    value={tim}
                    onChange={(e) => setTim(e.target.value)}
                    placeholder="Tìm kiếm trên Messenger"
                    className="w-full bg-transparent outline-none placeholder:text-white/45"
                  />
                </label>
              </div>
              <div className="flex gap-2 px-3 pb-2">
                {(
                  [
                    ["tat-ca", "Tất cả"],
                    ["chua-doc", "Chưa đọc"],
                  ] as const
                ).map(([khoa, nhan]) => (
                  <button
                    key={khoa}
                    type="button"
                    onClick={() => setLoc(khoa)}
                    aria-pressed={loc === khoa}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      loc === khoa
                        ? "bg-[#2374e1] text-white"
                        : "bg-[#3a3b3c] text-white/90 hover:bg-white/15"
                    }`}
                  >
                    {nhan}
                  </button>
                ))}
              </div>
              <ul className="flex-1 overflow-y-auto pb-2">
                {danhSach.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-white/55">
                    {loc === "chua-doc"
                      ? "Không có tin chưa đọc."
                      : "Không thấy cuộc nào."}
                  </li>
                ) : (
                  danhSach.map((nhom) => {
                    const dau = nhom.buoi[0];
                    const xem = xemTruoc[dau.b.id];
                    const laCuaToi = xem?.senderId === user?.id;
                    const dong = xem
                      ? `${laCuaToi ? "Bạn: " : ""}${xem.body}`
                      : dau.laKhach
                        ? "Bạn đặt buổi này"
                        : "Khách đặt với bạn";
                    const soChua = nhom.buoi.reduce(
                      (n, { b }) => n + (chuaDoc[b.id] ?? 0),
                      0,
                    );
                    const them =
                      nhom.buoi.length > 1 ? ` · ${nhom.buoi.length} buổi` : "";
                    return (
                      <li key={nhom.khoa}>
                        <button
                          type="button"
                          onClick={() => mo(dau.b.id)}
                          className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-white/10"
                        >
                          <Anh src={nhom.anh} ten={nhom.ten} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold">
                              {nhom.ten}
                            </span>
                            <span
                              className={`block truncate text-[13px] ${
                                soChua
                                  ? "font-semibold text-white"
                                  : "text-white/55"
                              }`}
                            >
                              {dong}
                              {them}
                              <span className="text-white/45">
                                {" "}
                                · {lucTuongDoi(xem?.at ?? dau.b.startTime)}
                              </span>
                            </span>
                          </span>
                          {soChua ? (
                            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#2374e1] px-1 text-[11px] font-semibold">
                              {soChua > 9 ? "9+" : soChua}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </LopPhu>
  );
}

export interface CuocChat {
  b: Booking;
  laKhach: boolean;
}

export interface NhomChat {
  khoa: string;
  ten: string;
  anh: string | null;
  buoi: CuocChat[];
}

/** Hai buổi với cùng một người là một dòng, không phải hai cái tên giống nhau. */
export function gopTheoNguoi(cuoc: CuocChat[]): NhomChat[] {
  const map = new Map<string, NhomChat>();
  for (const c of cuoc) {
    const id = c.laKhach ? c.b.readerUserId : c.b.customerId;
    const khoa = `${c.laKhach ? "k" : "r"}:${id}`;
    const co = map.get(khoa);
    if (co) co.buoi.push(c);
    else {
      map.set(khoa, {
        khoa,
        ten: tenDoiPhuong(c.b, c.laKhach),
        anh: anhDoiPhuong(c.b, c.laKhach),
        buoi: [c],
      });
    }
  }
  return [...map.values()];
}

/** Tên người BÊN KIA: khách thì thấy Reader, Reader thì thấy khách. */
function tenDoiPhuong(b: Booking, laKhach: boolean) {
  return laKhach ? b.readerName : b.customerName;
}

function anhDoiPhuong(b: Booking, laKhach: boolean) {
  return laKhach ? b.readerAvatar : b.customerAvatar;
}

function CacBuoi({
  buoi,
  dangXem,
  onChon,
}: {
  buoi: CuocChat[];
  dangXem: string;
  onChon: (id: string) => void;
}) {
  if (buoi.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-2">
      {buoi.map(({ b }) => {
        const gio = new Date(b.startTime).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const chon = b.id === dangXem;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChon(b.id)}
            aria-pressed={chon}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${
              chon ? "bg-gold text-black" : "bg-white/10 text-white/80"
            }`}
          >
            {gio}
          </button>
        );
      })}
    </div>
  );
}

function Anh({
  src,
  ten,
  nho = false,
}: {
  src: string | null;
  ten: string;
  nho?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#3a3b3c] font-semibold ${
        nho ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg"
      }`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        ten.charAt(0).toUpperCase()
      )}
    </span>
  );
}

/** "5 phút", "3 giờ", "5 tuần" — cùng cách đọc của danh sách Messenger. */
export function lucTuongDoi(iso: string, bayGio = Date.now()) {
  const luc = new Date(iso).getTime();
  if (Number.isNaN(luc)) return "";
  const giay = Math.max(0, Math.floor((bayGio - luc) / 1000));
  if (giay < 60) return "Vừa xong";
  const phut = Math.floor(giay / 60);
  if (phut < 60) return `${phut} phút`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ`;
  const ngay = Math.floor(gio / 24);
  if (ngay < 7) return `${ngay} ngày`;
  const tuan = Math.floor(ngay / 7);
  if (tuan < 13) return `${tuan} tuần`;
  const thang = Math.floor(ngay / 30);
  if (thang < 12) return `${thang} tháng`;
  return `${Math.floor(ngay / 365)} năm`;
}
