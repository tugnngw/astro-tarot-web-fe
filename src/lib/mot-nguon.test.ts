import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Chốt quy tắc "một nguồn" bằng test, không bằng lời nhắc.
 *
 * ## Vì sao cần test chứ không phải một dòng trong CONTRIBUTING
 *
 * Dự án này từng có **chín** hàm định dạng tiền và **bảy mươi bốn** mã màu
 * viết tay. Không ai cố ý làm vậy: mỗi lần chỉ là một màn mới cần hiện tiền,
 * viết hai dòng là xong, nhanh hơn đi tìm hàm có sẵn. Sai lệch kiểu này tích
 * lại dần và không bao giờ lộ ra trong một lần review — nó chỉ lộ khi đặt hai
 * ảnh chụp cạnh nhau.
 *
 * Nên chỗ duy nhất bắt được nó là lúc chạy test.
 */

const GOC = join(import.meta.dirname, "..");

function moiTepNguon(): string[] {
  const ra: string[] = [];
  (function quet(d: string) {
    for (const ten of readdirSync(d)) {
      const p = join(d, ten);
      if (statSync(p).isDirectory()) {
        // components/ui là thư viện ngoài (shadcn) — không phải mã của mình.
        if (ten !== "ui" && ten !== "node_modules") quet(p);
      } else if (/\.tsx?$/.test(ten) && !/\.test\.tsx?$/.test(ten)) {
        ra.push(p);
      }
    }
  })(GOC);
  return ra;
}

const TEP = moiTepNguon().map((p) => ({
  ten: relative(GOC, p).split(sep).join("/"),
  noiDung: readFileSync(p, "utf-8"),
}));

/** Bỏ bình luận, để chuỗi nhắc tới màu cũ trong tài liệu không bị tính là màu. */
function boBinhLuan(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("một nguồn cho định dạng số", () => {
  it("chỉ lib/tien.ts được tạo Intl.NumberFormat", () => {
    const pham = TEP.filter(
      (t) => t.ten !== "lib/tien.ts" && boBinhLuan(t.noiDung).includes("Intl.NumberFormat"),
    ).map((t) => t.ten);

    expect(
      pham,
      'Dùng tien() hoặc so() từ "@/lib/tien" thay vì tự tạo Intl.NumberFormat.',
    ).toEqual([]);
  });

  it("không ai tự nối ký hiệu ₫", () => {
    const pham = TEP.filter(
      (t) =>
        t.ten !== "lib/tien.ts" &&
        /\+\s*" ?₫"|\$\{[^}]*\}\s*₫/.test(boBinhLuan(t.noiDung)),
    ).map((t) => t.ten);

    expect(pham, "tien() đã gắn ký hiệu ₫ sẵn.").toEqual([]);
  });

  it("không ai gọi toLocaleString trần — lệch locale giữa SSR và máy khách", () => {
    const pham = TEP.filter((t) => /\.toLocaleString\(\s*\)/.test(boBinhLuan(t.noiDung))).map((t) => t.ten);
    expect(pham).toEqual([]);
  });
});

/**
 * Mã màu viết tay được tha, kèm LÝ DO.
 *
 * Danh sách này là hợp đồng: thêm một dòng vào đây là một quyết định có chủ ý,
 * phải viết được vì sao màu ấy không thuộc bảng màu. Còn thêm màu mà không
 * khai ở đây thì test đỏ.
 */
const MIEN_TRU: Record<string, string> = {
  "components/AuthModal.tsx": "màu thương hiệu Google — logo sai màu là vi phạm brand guideline của họ",
  "components/TopReaders.tsx": "gradient trang trí, không mang nghĩa dữ liệu",
  "components/CelestialArtwork.tsx": "tranh minh hoạ",
  "components/AstroChart.tsx": "gradient của vòng hoàng đạo",
  "components/MysticEye.tsx": "hiệu ứng quầng sáng",
  "components/StarrySky.tsx": "nền trời đêm",
  "components/DailyCardDraw.tsx": "mặt sau lá tarot",
  "routes/index.tsx": "lớp phủ tối sau chữ ở ảnh bìa",
  "lib/mau-bieu-do.ts": "chính nó LÀ bảng màu",
  "lib/error-page.ts":
    "trang HTML độc lập trả về khi ứng dụng không dựng được — lúc ấy chưa có " +
    "bundle CSS nào, nên không dùng được token Tailwind; cũng là lý do nó " +
    "theo nền sáng chứ không theo giao diện tối của sản phẩm",
  "features/admin/components/AdminAnalyticsDashboard.tsx": "chuỗi JSON ví dụ trong hướng dẫn cấu hình GA4, không phải màu",
};

describe("một nguồn cho màu", () => {
  it("không có mã màu viết tay ngoài danh sách miễn trừ", () => {
    const pham = TEP.filter((t) => {
      if (MIEN_TRU[t.ten]) return false;
      const sach = boBinhLuan(t.noiDung);
      return /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b|oklch\(/.test(sach);
    }).map((t) => t.ten);

    expect(
      pham,
      'Dùng token Tailwind (bg-gold, text-gold-foreground…) hoặc MAU/KHUNG từ "@/lib/mau-bieu-do".',
    ).toEqual([]);
  });

  it("mọi tệp trong danh sách miễn trừ vẫn còn tồn tại", () => {
    // Để danh sách không mục ruỗng: tệp đổi tên hay bị xoá thì phải cập nhật.
    const con = new Set(TEP.map((t) => t.ten));
    const mat = Object.keys(MIEN_TRU).filter((f) => !con.has(f));
    expect(mat, "Xoá khỏi MIEN_TRU những tệp không còn.").toEqual([]);
  });
});
