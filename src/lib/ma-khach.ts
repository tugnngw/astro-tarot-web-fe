const KHOA = "astrotarot_ma_khach";

/**
 * Mã khách ẩn danh, để nối các hành động của cùng một người lại với nhau.
 *
 * ## Nó KHÔNG phải danh tính
 *
 * Không tên, không email, không số điện thoại — chỉ là một chuỗi ngẫu nhiên
 * sinh ngay trong trình duyệt. Xoá dữ liệu trình duyệt là thành khách mới,
 * và không có cách nào từ mã này suy ra người thật. Đúng mức cần để đọc được
 * hành trình, không hơn.
 *
 * ## Vì sao cần
 *
 * Thiếu nó, bảng sự kiện chỉ là một đống lượt bấm rời rạc: biết có 11 lượt
 * sang Shopee, nhưng không biết đó là 11 người bấm một lần hay một người bấm
 * 11 lần. Và nhất là không dựng lại được câu chuyện — "khách này vào từ
 * Facebook, xem trang chủ, mở Tarot, rút một quẻ rồi đi".
 *
 * ## Vì sao không ném khi localStorage hỏng
 *
 * Cửa sổ ẩn danh, trình duyệt chặn site data, hoặc bộ nhớ đầy — `localStorage`
 * đều ném. Theo dõi là việc phụ; ném ở đây là làm hỏng đúng thao tác người
 * dùng vừa làm. Trả chuỗi rỗng thì máy chủ ghi `visitor_id = NULL`, hành
 * trình của riêng khách ấy không dựng được, còn mọi thứ khác vẫn chạy.
 */
export function maKhach(): string {
  if (typeof window === "undefined") return "";

  try {
    const daCo = localStorage.getItem(KHOA);
    if (daCo) return daCo;

    const moi = sinhMa();
    localStorage.setItem(KHOA, moi);
    return moi;
  } catch {
    return "";
  }
}

/**
 * Sinh mã. Dùng `crypto.randomUUID` khi có, không thì ghép số ngẫu nhiên.
 *
 * `randomUUID` chỉ tồn tại trong ngữ cảnh an toàn (https hoặc localhost).
 * Gọi thẳng mà không kiểm là mọi trang chạy qua http trần ném `TypeError`
 * ngay lần tải đầu — và chỗ ném lại nằm trong đường đi của mọi sự kiện.
 */
function sinhMa(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
