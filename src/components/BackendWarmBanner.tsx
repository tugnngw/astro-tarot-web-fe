import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/api/client";

/**
 * Banner khi backend trên gói free của Render đang khởi động dậy.
 *
 * <p>Mục đích: lần gọi đầu sau khi dịch vụ ngủ mất 30–60 giây, và một trang
 * đứng im ngần ấy lâu trông như đã sập. Nói ra thì người xem chịu chờ.
 *
 * <h3>Bản trước treo vĩnh viễn — hai lỗi chồng nhau</h3>
 *
 * <p><b>Một:</b> nó gọi `/ping`, mà endpoint đó chưa từng tồn tại ở backend —
 * đường dẫn có trong danh sách công khai của SecurityConfig nhưng không
 * controller nào phục vụ. Mọi lần dò đều nhận 404.
 *
 * <p><b>Hai:</b> nhánh `!res.ok` bật banner rồi dừng hẳn — `pingAgain()` chỉ
 * được gọi trong khối `catch`. Nên một phản hồi "có trả lời nhưng không phải
 * 2xx" khoá banner lại mãi mãi. Đúng thứ đã xảy ra: banner chạy số giây tăng
 * dần trong khi máy chủ vẫn khoẻ.
 *
 * <p>Nguyên tắc rút ra và áp dụng ở đây: <b>không có nhánh nào được phép kết
 * thúc ở trạng thái "đang chờ" mà không hẹn một lần thử lại.</b>
 */
export function BackendWarmBanner() {
  const [dangDay, setDangDay] = useState(false);
  const [giay, setGiay] = useState(0);

  useEffect(() => {
    if (!API_BASE) return;

    let huy = false;
    const batDau = Date.now();
    let demGio: ReturnType<typeof setInterval> | undefined;
    let henThuLai: ReturnType<typeof setTimeout> | undefined;

    /** Chỉ hiện banner khi đã chờ đủ lâu để người dùng kịp thấy trang đứng im. */
    const NGUONG_MS = 2500;

    function batDauDem() {
      if (demGio) return;
      demGio = setInterval(() => {
        setGiay(Math.round((Date.now() - batDau) / 1000));
      }, 1000);
    }

    function xong() {
      setDangDay(false);
      if (demGio) clearInterval(demGio);
      demGio = undefined;
    }

    async function do_() {
      if (huy) return;

      try {
        // Hạn giờ 70 giây: dài hơn cả một lần Render khởi động lại, nên hết
        // hạn nghĩa là có chuyện khác chứ không phải đang dậy.
        const res = await fetch(`${API_BASE}/ping`, {
          cache: "no-store",
          signal: AbortSignal.timeout(70_000),
        });
        if (huy) return;

        if (res.ok) {
          xong();
          return;
        }

        // Có trả lời nhưng không phải 2xx. KHÔNG dừng ở đây — chính chỗ này là
        // nơi bản trước treo lại.
        thuLai();
      } catch {
        if (huy) return;
        thuLai();
      }
    }

    function thuLai() {
      if (huy) return;
      if (Date.now() - batDau > NGUONG_MS) {
        setDangDay(true);
        batDauDem();
      }
      henThuLai = setTimeout(() => void do_(), 3000);
    }

    void do_();

    return () => {
      huy = true;
      if (demGio) clearInterval(demGio);
      if (henThuLai) clearTimeout(henThuLai);
    };
  }, []);

  if (!dangDay) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] border-b border-amber-400/30 bg-amber-950/95 px-4 py-2 text-center text-xs text-amber-100 backdrop-blur"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Máy chủ đang khởi động (gói free, ~30–60 giây)
        {giay > 0 ? ` · ${giay}s` : ""}. Đừng đóng tab — trang sẽ chạy tiếp khi
        sẵn sàng.
      </span>
    </div>
  );
}
