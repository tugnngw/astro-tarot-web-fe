import { useEffect } from "react";
import { toast } from "sonner";

/** Máy chủ gắn tham số này khi chặng Google trả người dùng về mà hỏng. */
const THAM_SO = "dang-nhap";
const GIA_TRI_LOI = "google-loi";

/**
 * Nói cho người dùng biết đăng nhập Google vừa hỏng.
 *
 * ## Vì sao cần
 *
 * Máy chủ đưa người hỏng về `/?dang-nhap=google-loi`. Trước tệp này không ai
 * đọc tham số ấy, nên họ về trang chủ y như chưa bấm gì — không biết đã hỏng,
 * không biết có nên thử lại.
 *
 * Trước nữa thì còn tệ hơn: lỗi ném thẳng từ bộ lọc nên Tomcat trả trang
 * "HTTP Status 500 – Internal Server Error" trần trên tên miền `api`, không
 * có một đường nào quay lại trang web.
 *
 * ## Vì sao xoá tham số khỏi URL
 *
 * Để người dùng tải lại trang hay chia sẻ đường dẫn mà không thấy lại báo
 * lỗi cũ. Dùng `replaceState` nên không thêm một mục vào lịch sử — bấm Quay
 * lại vẫn về đúng chỗ họ đến từ đó.
 */
export function BaoLoiDangNhapGoogle() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dd = new URL(window.location.href);
    if (dd.searchParams.get(THAM_SO) !== GIA_TRI_LOI) return;

    toast.error("Đăng nhập Google chưa xong", {
      description:
        "Có trục trặc ở bước Google trả về. Thử lại, hoặc đăng nhập bằng email và mật khẩu.",
      duration: 6000,
    });

    dd.searchParams.delete(THAM_SO);
    window.history.replaceState({}, "", dd.pathname + dd.search + dd.hash);
  }, []);

  return null;
}
