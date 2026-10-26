import type { BuocHanhTrinh, HanhTrinhKhach } from "@/api/marketing";

/**
 * Phần suy luận của bảng "Hành trình người dùng", tách khỏi giao diện.
 *
 * Để riêng vì đây là chỗ dễ sai mà nhìn màn hình không phát hiện ra: gộp
 * nhầm hai bước khác nhau, hay đếm lặp lệch một đơn vị, thì bảng vẫn hiện ra
 * đẹp đẽ và vẫn sai.
 */

/** Tên sự kiện trong CSDL → câu người đọc hiểu ngay. */
export const TEN_HANH_DONG: Record<string, string> = {
  xem_trang: "Xem",
  /** Ứng dụng di động gửi tên này thay cho `xem_trang`. */
  xem_man: "Xem",
  dang_ky_tai_khoan: "Đăng ký tài khoản",
  bat_dau_chat_ai: "Mở chat Tarot AI",
  rut_bai_tarot: "Rút bài",
  dat_lich_reader: "Đặt lịch Reader",
  gui_gop_y: "Gửi góp ý",
  cta_shopee_click: "Sang Shopee",
  cta_tarot_draw: "Bấm Trải bài",
  cta_book_reader: "Bấm Đặt lịch",
};

/**
 * Hành động đáng chú ý — thứ cho biết khách đã làm gì có ý nghĩa, chứ không
 * chỉ lướt qua. Cũng là tập dùng cho bộ lọc "chỉ hành trình có chuyển đổi".
 */
export const DANG_CHU_Y = new Set([
  "dang_ky_tai_khoan",
  "rut_bai_tarot",
  "dat_lich_reader",
  "cta_shopee_click",
  "gui_gop_y",
  "bat_dau_chat_ai",
]);

/**
 * Đường dẫn → tên trang người đọc hiểu.
 *
 * ## Vì sao không hiện thẳng đường dẫn
 *
 * `/profile/wallet` hay `/chinh-sach-rieng-tu` bắt người đọc tự dịch sang
 * "Ví" và "Chính sách riêng tư" trong đầu, mỗi dòng một lần. GA4 gọi đúng
 * thứ này là `page_title` và hiện nó thay cho `page_path` ở những báo cáo
 * dành cho người đọc, chỉ giữ đường dẫn ở chỗ tra cứu kỹ thuật.
 *
 * Ở đây giữ cả hai: tên để đọc, đường dẫn đầy đủ nằm trong `title` của thẻ.
 */
const TEN_TRANG: Record<string, string> = {
  "/": "Trang chủ",
  "/home": "Trang chủ",
  "/tarot": "Trải bài Tarot",
  "/tarot-history": "Lịch sử trải bài",
  "/readers": "Tìm Reader",
  "/shop": "Cửa hàng",
  "/blog": "Bài viết",
  "/blogs": "Danh sách bài viết",
  "/bookings": "Lịch hẹn",
  "/profile": "Hồ sơ",
  "/profile/wallet": "Ví",
  "/profile/subscription": "Gói dịch vụ",
  "/profile/astrology": "Lá số",
  "/admin": "Trang quản trị",
  "/staff": "Trang nhân viên",
  "/manager": "Trang quản lý",
  "/reader": "Khu Reader",
  "/reader-hub": "Khu Reader",
  "/support": "Hỗ trợ",
  "/chinh-sach-rieng-tu": "Chính sách riêng tư",
  "/ghi-cong": "Ghi công",
  "/xoa-tai-khoan": "Xoá tài khoản",
  "/oauth-success": "Đăng nhập Google",
  "/verify-email": "Xác minh email",
  "/reset-password": "Đặt lại mật khẩu",
};

/** Tiền tố → tên, cho những trang có tham số ở cuối. */
const TEN_THEO_TIEN_TO: [string, string][] = [
  ["/readers/", "Hồ sơ Reader"],
  ["/shop/", "Sản phẩm"],
  ["/blog/", "Bài viết"],
];

export function tenTrang(duongDan: string | null): string {
  if (!duongDan) return "trang không rõ";

  // Ứng dụng di động gửi `app:ten_man`, không phải đường dẫn web.
  if (duongDan.startsWith("app:")) {
    const man = duongDan.slice(4).trim();
    // Hôm nay app gửi đúng tên sự kiện làm đường dẫn (`app:xem_man`), tức là
    // không kèm tên màn nào cả. Ghép ra "Xem màn xem man" thì vừa thừa vừa
    // khó hiểu; nói thẳng là không biết màn nào thì đúng hơn.
    if (!man || man === "xem_man" || man === "xem_trang") {
      return "trong ứng dụng";
    }
    return "màn " + man.replace(/_/g, " ");
  }

  const sach = duongDan.split("?")[0].replace(/\/+$/, "") || "/";
  const biet = TEN_TRANG[sach];
  if (biet) return biet;

  for (const [tienTo, ten] of TEN_THEO_TIEN_TO) {
    if (sach.startsWith(tienTo)) {
      const duoi = sach.slice(tienTo.length);
      return duoi ? `${ten}: ${docDuocSlug(duoi)}` : ten;
    }
  }
  return sach;
}

/**
 * `chu-de-giai-ma-la-bai` → `Chu de giai ma la bai`.
 *
 * Chỉ bỏ gạch nối và viết hoa chữ đầu. Không cố khôi phục dấu tiếng Việt:
 * đoán sai một chữ là ra một tiêu đề khác hẳn, mà slug không đủ thông tin
 * để đoán đúng.
 */
function docDuocSlug(slug: string): string {
  const chu = slug.split("/")[0].replace(/-/g, " ").trim();
  const hoa = chu.charAt(0).toUpperCase() + chu.slice(1);
  // Slug bài viết dài tới 70 ký tự; để nguyên thì một thẻ nuốt cả dòng.
  return hoa.length > DAI_NHAT ? hoa.slice(0, DAI_NHAT).trimEnd() + "…" : hoa;
}

/** Giới hạn chữ của phần tên lấy từ slug. */
const DAI_NHAT = 32;

const NHAN_KHOA: Record<string, string> = {
  slug: "sản phẩm",
  sao: "số sao",
  nguon_gop_y: "từ màn",
  co_la_so: "có lá số",
  kieu_trai: "kiểu trải",
  so_la: "số lá",
  ten_reader: "Reader",
};

/**
 * Chi tiết đọc từ `metadata` của sự kiện — thứ biến "Sang Shopee" thành
 * "Sang Shopee · sản phẩm: bo-bai-rider-waite".
 *
 * Trả `null` khi không có gì đáng hiện, kể cả lúc máy chủ chưa trả trường
 * này về. Bản BE cũ không có `metadata`, nên giao diện phải chạy được mà
 * không có nó — nếu không, mở bảng quản trị trước khi deploy BE là trắng màn.
 */
export function chiTietBuoc(b: BuocHanhTrinh): string | null {
  if (!b.metadata) return null;

  let doc: unknown;
  try {
    doc = JSON.parse(b.metadata);
  } catch {
    return null;
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;

  // `duong_dan` chỉ lặp lại thứ đã hiện ở tên trang.
  const phan: string[] = [];
  for (const [khoa, gt] of Object.entries(doc as Record<string, unknown>)) {
    if (khoa === "duong_dan") continue;
    if (gt === null || gt === undefined || gt === "") continue;
    phan.push(`${NHAN_KHOA[khoa] ?? khoa}: ${String(gt)}`);
  }
  return phan.length ? phan.join(" · ") : null;
}

/** Một nhóm bước giống hệt nhau, nằm liền nhau. */
export interface NhomBuoc {
  hanhDong: string;
  duongDan: string | null;
  /** Số lần lặp liên tiếp. `1` nghĩa là không lặp. */
  soLan: number;
  dau: string;
  cuoi: string;
  chiTiet: string | null;
}

/**
 * Gộp những bước GIỐNG HỆT NHAU NẰM LIỀN NHAU thành một.
 *
 * ## Vì sao
 *
 * Một phiên quản trị thật có 48 bước, trong đó hơn 40 là `Xem /admin` lặp
 * lại vì mỗi lần đổi tab là một lượt xem trang. In cả 48 thẻ ra thì chúng
 * đẩy nhau xuống bốn năm dòng và che mất những bước HIẾM — vốn mới là thứ
 * đáng đọc. Gộp lại còn chừng sáu nhóm, và con số `×41` nói đúng thứ cần nói.
 *
 * Chỉ gộp khi NẰM LIỀN NHAU: `A A B A` phải ra `A×2, B, A` chứ không phải
 * `A×3, B`. Gộp cả những lần cách quãng là xoá mất thứ tự, mà thứ tự chính
 * là nội dung của hành trình.
 */
export function gomBuocLienTiep(cacBuoc: BuocHanhTrinh[]): NhomBuoc[] {
  const ra: NhomBuoc[] = [];
  for (const b of cacBuoc) {
    const truoc = ra[ra.length - 1];
    const chiTiet = chiTietBuoc(b);
    if (
      truoc &&
      truoc.hanhDong === b.hanhDong &&
      truoc.duongDan === b.duongDan &&
      truoc.chiTiet === chiTiet
    ) {
      truoc.soLan += 1;
      truoc.cuoi = b.luc;
      continue;
    }
    ra.push({
      hanhDong: b.hanhDong,
      duongDan: b.duongDan,
      soLan: 1,
      dau: b.luc,
      cuoi: b.luc,
      chiTiet,
    });
  }
  return ra;
}

/** Nhãn đầy đủ của một nhóm: hành động, kèm tên trang nếu là lượt xem. */
/** Những sự kiện mà tên TRANG mới là nội dung chính, không phải tên sự kiện. */
const LA_LUOT_XEM = new Set(["xem_trang", "xem_man"]);

export function nhanNhom(n: NhomBuoc): string {
  const ten = TEN_HANH_DONG[n.hanhDong] ?? n.hanhDong;
  return LA_LUOT_XEM.has(n.hanhDong) ? `${ten} ${tenTrang(n.duongDan)}` : ten;
}

export interface BoLoc {
  tim: string;
  nguon: string;
  /** Tên sự kiện, hoặc `__chu_y__` cho "có bất kỳ hành động đáng chú ý nào". */
  hanhDong: string;
  chiDangNhap: boolean;
}

export const BO_LOC_RONG: BoLoc = {
  tim: "",
  nguon: "",
  hanhDong: "",
  chiDangNhap: false,
};

export function coLocDangBat(loc: BoLoc): boolean {
  return (
    loc.tim.trim() !== "" ||
    loc.nguon !== "" ||
    loc.hanhDong !== "" ||
    loc.chiDangNhap
  );
}

/**
 * Lọc danh sách hành trình.
 *
 * Ô tìm soi cả mã khách, tên người dùng và TÊN TRANG đã ghé — gõ "Shopee"
 * hay "Ví" phải ra kết quả, chứ bắt gõ đúng `/profile/wallet` thì ô tìm chỉ
 * dùng được bởi người đã thuộc đường dẫn, tức là không ai.
 */
export function locHanhTrinh(
  ds: HanhTrinhKhach[],
  loc: BoLoc,
): HanhTrinhKhach[] {
  const tim = loc.tim.trim().toLowerCase();
  return ds.filter((k) => {
    if (loc.nguon && k.nguon !== loc.nguon) return false;
    if (loc.chiDangNhap && !k.tenNguoiDung) return false;
    if (loc.hanhDong) {
      const co =
        loc.hanhDong === "__chu_y__"
          ? k.cacBuoc.some((b) => DANG_CHU_Y.has(b.hanhDong))
          : k.cacBuoc.some((b) => b.hanhDong === loc.hanhDong);
      if (!co) return false;
    }
    if (tim) {
      const kho = [
        k.maKhach,
        k.tenNguoiDung ?? "",
        k.nguon,
        k.kenh ?? "",
        k.chienDich ?? "",
        ...k.cacBuoc.map(
          (b) =>
            `${TEN_HANH_DONG[b.hanhDong] ?? b.hanhDong} ${tenTrang(
              b.duongDan,
            )} ${b.duongDan ?? ""}`,
        ),
      ]
        .join(" ")
        .toLowerCase();
      if (!kho.includes(tim)) return false;
    }
    return true;
  });
}

/** Các nguồn có mặt trong dữ liệu, để đổ vào ô chọn. */
export function cacNguon(ds: HanhTrinhKhach[]): string[] {
  return [...new Set(ds.map((k) => k.nguon))].sort((a, b) =>
    a.localeCompare(b, "vi"),
  );
}

/** Các hành động có mặt, sắp theo tên hiển thị. */
export function cacHanhDong(ds: HanhTrinhKhach[]): string[] {
  const co = new Set<string>();
  for (const k of ds) for (const b of k.cacBuoc) co.add(b.hanhDong);
  return [...co].sort((a, b) =>
    (TEN_HANH_DONG[a] ?? a).localeCompare(TEN_HANH_DONG[b] ?? b, "vi"),
  );
}
