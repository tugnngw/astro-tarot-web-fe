import { useQuery } from "@tanstack/react-query";
import { Footprints, User } from "lucide-react";
import { getHanhTrinhKhach, type HanhTrinhKhach } from "@/api/marketing";
import { ChuThich } from "@/components/ChuThich";

/** Tên sự kiện trong CSDL → câu người đọc hiểu ngay. */
const TEN_VIET: Record<string, string> = {
  xem_trang: "Xem trang",
  dang_ky_tai_khoan: "Đăng ký tài khoản",
  bat_dau_chat_ai: "Mở chat Tarot AI",
  rut_bai_tarot: "Rút bài",
  dat_lich_reader: "Đặt lịch Reader",
  gui_gop_y: "Gửi góp ý",
  cta_shopee_click: "Sang Shopee",
  cta_tarot_draw: "Bấm Trải bài",
  cta_book_reader: "Bấm Đặt lịch",
};

/** Hành động đáng chú ý — tô vàng để lướt mắt là thấy. */
const DANG_CHU_Y = new Set([
  "dang_ky_tai_khoan",
  "rut_bai_tarot",
  "dat_lich_reader",
  "cta_shopee_click",
  "gui_gop_y",
]);

function gio(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ngay(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Từng khách một: vào từ đâu, rồi làm những gì.
 *
 * ## Vì sao cần, dù đã có bảng gộp theo nguồn
 *
 * Bảng kia nói "Facebook mang về 21 lượt" — một con số không nói được
 * chuyện gì đã xảy ra. Cái này nói "khách `ab12cd` vào từ Facebook lúc
 * 20:14, xem trang chủ, mở Tarot, rút một quẻ, rồi đi". Nhìn mươi hành
 * trình như vậy là thấy ngay chỗ người ta bỏ cuộc.
 *
 * ## Mã khách không phải danh tính
 *
 * Nó là chuỗi ngẫu nhiên sinh trong trình duyệt — không tên, không email.
 * Xoá dữ liệu trình duyệt là thành khách mới. Tên chỉ hiện khi người ta
 * đăng nhập giữa chừng, và lúc ấy là tài khoản thật của chính họ.
 */
export function HanhTrinhTungKhach() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketing", "hanh-trinh"],
    queryFn: () => getHanhTrinhKhach(20),
    refetchInterval: 60_000,
  });

  const ds = data ?? [];

  return (
    <section className="glass rounded-2xl border border-white/10 p-5">
      <div className="flex items-center gap-1.5">
        <Footprints className="h-4 w-4 shrink-0 text-gold" />
        <h3 className="font-medium">Từng khách vào từ đâu, rồi làm gì</h3>
        <span className="text-xs text-muted-foreground/60">20 gần nhất</span>
        <ChuThich>
          Mã khách là chuỗi ngẫu nhiên sinh trong trình duyệt — không phải
          tên, email hay số điện thoại. Tên chỉ hiện khi người đó tự đăng
          nhập.
        </ChuThich>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Đang tải…</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-destructive-soft">Không đọc được hành trình.</p>
      )}
      {!isLoading && !isError && ds.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Chưa có khách nào được ghi nhận. Mỗi lượt mở trang kể từ bây giờ sẽ
          hiện ở đây.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {ds.map((k) => (
          <TheKhach key={k.maKhach + k.batDau} khach={k} />
        ))}
      </div>
    </section>
  );
}

function TheKhach({ khach: k }: { khach: HanhTrinhKhach }) {
  const laKhongRo = k.nguon.startsWith("(");

  return (
    <div className="rounded-xl bg-mystic/10 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {k.maKhach}
        </span>

        <span
          className={
            laKhongRo
              ? "rounded-full border border-white/10 px-2 py-0.5 text-xs text-muted-foreground"
              : "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success"
          }
        >
          {k.nguon}
          {k.kenh ? ` · ${k.kenh}` : ""}
          {k.chienDich ? ` · ${k.chienDich}` : ""}
        </span>

        {k.tenNguoiDung && (
          <span className="flex items-center gap-1 text-xs text-gold">
            <User className="h-3 w-3" />
            {k.tenNguoiDung}
          </span>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {ngay(k.batDau)} · {gio(k.batDau)}–{gio(k.ketThuc)} ·{" "}
          {k.soHanhDong} bước
        </span>
      </div>

      <ol className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1.5">
        {k.cacBuoc.map((b, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/40">›</span>}
            <span
              className={
                DANG_CHU_Y.has(b.hanhDong)
                  ? "rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-xs text-gold"
                  : "rounded border border-white/10 px-1.5 py-0.5 text-xs text-muted-foreground"
              }
              title={`${b.duongDan ?? ""} · ${gio(b.luc)}`}
            >
              {TEN_VIET[b.hanhDong] ?? b.hanhDong}
              {b.hanhDong === "xem_trang" && b.duongDan && (
                <span className="text-muted-foreground/60">
                  {" "}
                  {duongDanNgan(b.duongDan)}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** `app:xem_trang` hoặc `/tarot?x=1` → phần dễ đọc. */
function duongDanNgan(d: string) {
  const sach = d.replace(/^app:/, "").split("?")[0];
  return sach.length > 24 ? sach.slice(0, 24) + "…" : sach;
}
