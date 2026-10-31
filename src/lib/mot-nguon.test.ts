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
  "components/TarotWheel.tsx": "bóng đổ đen — xem boDenTrang bên dưới",
  "lib/error-page.ts":
    "trang HTML độc lập trả về khi ứng dụng không dựng được — lúc ấy chưa có " +
    "bundle CSS nào, nên không dùng được token Tailwind; cũng là lý do nó " +
    "theo nền sáng chứ không theo giao diện tối của sản phẩm",
  "features/admin/components/AdminAnalyticsDashboard.tsx": "chuỗi JSON ví dụ trong hướng dẫn cấu hình GA4, không phải màu",
};

describe("một nguồn cho màu", () => {
  /**
   * Đen và trắng thuần ở độ mờ bất kỳ KHÔNG tính là màu viết tay.
   *
   * Đó là bóng đổ và mực tương phản, không phải một sắc trong bảng màu —
   * chính Tailwind cũng viết `black/90` cho việc này. Lọc chúng ra ở đây để
   * phép kiểm nhắm đúng thứ cần nhắm: sắc của sản phẩm bị viết lặp bằng tay.
   */
  function boDenTrang(s: string): string {
    return s.replace(/rgba?\(\s*(?:0\s*[, ]\s*0\s*[, ]\s*0|255\s*[, ]\s*255\s*[, ]\s*255)\s*[,/][^)]*\)/g, "");
  }

  it("không có màu số viết tay ngoài danh sách miễn trừ", () => {
    const pham = TEP.filter((t) => {
      if (MIEN_TRU[t.ten]) return false;
      const sach = boDenTrang(boBinhLuan(t.noiDung));
      // `rgb(var(--gold-rgb)/…)` được phép: nó TRỎ VỀ token, không tự định
      // nghĩa màu. Nên phép kiểm chỉ bắt kênh màu viết thẳng bằng số.
      return /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b|oklch\(|rgba?\(\s*[0-9]|hsla?\(\s*[0-9]/.test(
        sach,
      );
    }).map((t) => t.ten);

    expect(
      pham,
      'Dùng token Tailwind (bg-gold, text-primary-foreground…), rgb(var(--gold-rgb)/…) cho quầng sáng, hoặc MAU/KHUNG từ "@/lib/mau-bieu-do".',
    ).toEqual([]);
  });

  it("mọi tệp trong danh sách miễn trừ vẫn còn tồn tại", () => {
    // Để danh sách không mục ruỗng: tệp đổi tên hay bị xoá thì phải cập nhật.
    const con = new Set(TEP.map((t) => t.ten));
    const mat = Object.keys(MIEN_TRU).filter((f) => !con.has(f));
    expect(mat, "Xoá khỏi MIEN_TRU những tệp không còn.").toEqual([]);
  });
});

/**
 * Thang cỡ chữ.
 *
 * Mọi cỡ chữ phải là một bậc có tên trong `@theme` của `styles.css`. Giá trị
 * tự chế không sai về mặt kỹ thuật, nhưng nó phá thang: hai màn cạnh nhau
 * dùng 16.8px và 18px cho cùng một vai trò thì không gì trông cố ý.
 */
describe("một nguồn cho cỡ chữ", () => {
  const MIEN_TRU_CO_CHU: Record<string, string> = {
    "features/astrology/components/AstroChart.tsx":
      "nhãn 6px/8px trên vòng hoàng đạo — nhỏ hơn bậc nhỏ nhất của thang, và " +
      "nằm trong SVG nên không theo được thang chữ của trang",
    "lib/mau-bieu-do.ts": "chính nó LÀ thang cỡ chữ của biểu đồ (KHUNG.coChu*)",
  };

  it("không có cỡ chữ tự chế", () => {
    const pham = TEP.filter((t) => {
      if (MIEN_TRU_CO_CHU[t.ten]) return false;
      const sach = boBinhLuan(t.noiDung);
      return /text-\[[0-9.]+(?:px|rem|em)\]|fontSize:\s*[0-9]/.test(sach);
    }).map((t) => t.ten);

    expect(
      pham,
      "Thêm một bậc có tên vào @theme trong styles.css, hoặc dùng KHUNG.coChu* cho chữ trong biểu đồ.",
    ).toEqual([]);
  });

  it("mọi tệp miễn trừ cỡ chữ vẫn còn tồn tại", () => {
    const con = new Set(TEP.map((t) => t.ten));
    expect(Object.keys(MIEN_TRU_CO_CHU).filter((f) => !con.has(f))).toEqual([]);
  });
});

/**
 * Màu trạng thái.
 *
 * ## Vì sao cần
 *
 * Sản phẩm có sẵn `--success`, `--warning`, `--destructive`, nhưng đo ra thì
 * `--success` được dùng **1** lần và `--warning` **0** lần, trong khi bảng màu
 * thô của Tailwind được dùng 340 lần cho đúng ba vai trò ấy. Hậu quả nhìn
 * thấy được:
 *
 * - "thành công" có hai sắc xanh: `emerald-300` và `emerald-400`
 * - "nguy hiểm" có BA cách nói: `--destructive`, `red-*` và `rose-*` — mà đỏ
 *   và hồng lệch hẳn sắc
 * - riêng chữ báo lỗi dùng 6 sắc khác nhau, viền dùng 7 mức khác nhau
 *
 * Không ai cố ý: `text-emerald-400` đọc ra nghĩa ngay và gõ nhanh hơn là đi
 * tra token tên gì. Nên lại là thứ chỉ test bắt được.
 */
describe("một nguồn cho màu trạng thái", () => {
  /**
   * Trang trí được phép dùng bảng màu thô.
   *
   * Màu theo nguyên tố của 12 cung, màu giấy lá tarot, quầng sáng — chúng
   * KHÔNG mang nghĩa trạng thái. Ép `text-success` lên một cung Kim Ngưu là
   * nói sai: xanh ở đó là nguyên tố Đất, không phải "thành công".
   */
  const MIEN_TRU_TRANG_THAI: Record<string, string> = {
    "components/ZodiacCarousel.tsx": "màu theo nguyên tố của từng cung hoàng đạo",
    "components/TopReaders.tsx": "gradient trang trí theo hạng",
    "features/readers/components/TopReaders.tsx": "gradient trang trí theo hạng",
    "features/astrology/components/AstroChart.tsx": "màu hành tinh trên vòng hoàng đạo",
    "features/tarot/components/TarotCard.tsx": "sắc giấy của mặt lá tarot",
    "features/admin/feedback-utils.ts":
      "màu theo NGUỒN gửi phản hồi — phân loại, không phải trạng thái; " +
      '"LANDING" không mang nghĩa thành công',
    "lib/roles.ts":
      "màu chip theo vai trò — phân loại, không phải trạng thái; " +
      '"staff" không mang nghĩa thành công',
  };

  it("không dùng bảng màu thô của Tailwind cho trạng thái", () => {
    const pham = TEP.filter((t) => {
      if (MIEN_TRU_TRANG_THAI[t.ten]) return false;
      return /\b[a-z-]+-(?:emerald|green|amber|yellow|red|rose)-[0-9]{2,3}\b/.test(
        boBinhLuan(t.noiDung),
      );
    }).map((t) => t.ten);

    expect(
      pham,
      "Dùng text-success / bg-warning/10 / border-destructive-soft/30 … thay vì emerald-400, amber-300, rose-400.",
    ).toEqual([]);
  });

  it("mọi tệp miễn trừ màu trạng thái vẫn còn tồn tại", () => {
    const con = new Set(TEP.map((t) => t.ten));
    expect(Object.keys(MIEN_TRU_TRANG_THAI).filter((f) => !con.has(f))).toEqual([]);
  });
});

/**
 * Thang độ mờ của nền và viền.
 *
 * ## Vì sao cần
 *
 * Màu thì đúng token rồi, nhưng độ mờ vẫn trôi: riêng nền vàng từng có chín
 * mức — `/5 /10 /15 /20 /25 /30 /55 /90` và đặc — còn viền `destructive` có
 * năm. Trên nền tối, `/5` và `/15` không phân biệt được với `/10`, nên chúng
 * chỉ làm thang rộng ra mà không thêm nghĩa nào.
 *
 * Hệ quả giống hệt chuyện màu: mỗi chỗ một mức, nên không gì trông cố ý.
 */
describe("một nguồn cho thang độ mờ", () => {
  const VAI_TRO = "gold|success|warning|destructive-soft|destructive";

  /** `/90` chỉ để làm hover của nền ĐẶC, không phải một bậc nền pha mờ. */
  const NEN_CHO_PHEP = new Set(["10", "20", "90"]);
  const VIEN_CHO_PHEP = new Set(["20", "30", "50"]);

  function lech(dau: string, cho_phep: Set<string>) {
    const re = new RegExp(`\\b${dau}-(?:${VAI_TRO})/(\\d+)`, "g");
    const ra: string[] = [];
    for (const t of TEP) {
      for (const m of boBinhLuan(t.noiDung).matchAll(re)) {
        if (!cho_phep.has(m[1])) ra.push(`${t.ten}: ${m[0]}`);
      }
    }
    return ra;
  }

  it("nền pha mờ chỉ dùng /10, /20 (và /90 cho hover nền đặc)", () => {
    expect(
      lech("bg", NEN_CHO_PHEP),
      "Chọn /10 cho nền thường hoặc /20 cho nền nhấn — xem khối quy ước trong styles.css.",
    ).toEqual([]);
  });

  it("viền chỉ dùng /20, /30, /50", () => {
    expect(
      lech("border", VIEN_CHO_PHEP),
      "Chọn /20 viền mờ, /30 viền thường, /50 viền nhấn — xem khối quy ước trong styles.css.",
    ).toEqual([]);
  });
});

/**
 * Hạn mức AI chỉ có MỘT nơi được tính, và nơi ấy là máy chủ.
 *
 * ## Vì sao cần chốt bằng test
 *
 * Luật hạn mức từng bị chép lại ở BA chỗ trong giao diện, mỗi chỗ đều là
 * `max(dailyQuotaSnapshot)` rồi mặc định 3 nếu không có gói. Bản sao ấy đúng
 * cho tới ngày mini game bắt đầu thưởng lượt: backend CỘNG phần thưởng vào,
 * giao diện không biết gì về nó.
 *
 * Người dùng báo ngày 31/10/2026 — chơi game được thưởng 3 lượt mà huy hiệu
 * vẫn ghi "AI: 3/3 lượt". Lượt thưởng vẫn dùng được; chỉ là không chỗ nào
 * nói cho họ biết là họ có. Đó là kiểu lỗi không ai tìm ra bằng cách đọc
 * backend, vì backend đúng.
 *
 * Chép lại một phép tính của máy chủ thì nó đúng đúng tới lần máy chủ đổi
 * luật, và không có gì báo.
 */
describe("một nguồn cho hạn mức AI", () => {
  /** Nơi duy nhất được nhắc tới trường hạn mức của một gói để TÍNH tổng. */
  const CHO_PHEP = new Set(["api/subscription.ts"]);

  it("không ai tự tính tổng hạn mức bằng max() trên danh sách gói", () => {
    const pham = TEP.filter((t) => {
      if (CHO_PHEP.has(t.ten)) return false;
      const noi = boBinhLuan(t.noiDung);
      return /Math\.max\([^)]*dailyQuota/s.test(noi);
    }).map((t) => t.ten);

    expect(
      pham,
      'Hạn mức do máy chủ tính. Dùng `useAIQuota` (hoặc `subscriptionApi.getQuota`) ' +
        "thay vì max() trên danh sách gói — bản tự tính không biết lượt thưởng từ mini game.",
    ).toEqual([]);
  });

  it("không ai viết cứng hạn mức của gói miễn phí", () => {
    // `FREE_DAILY_QUOTA` sống ở backend. Viết lại con số ấy vào giao diện là
    // một nguồn sự thật thứ hai: đổi ở backend thì màn hình nói dối.
    const pham = TEP.filter((t) => {
      if (CHO_PHEP.has(t.ten)) return false;
      const noi = boBinhLuan(t.noiDung);
      return /(gói\s+FREE|gói\s+miễn\s+phí)[^.\n]{0,40}\(\s*\d+\s*lượt/i.test(noi);
    }).map((t) => t.ten);

    expect(
      pham,
      "Lấy số lượt của gói miễn phí từ máy chủ (`tuGoi`), đừng viết cứng.",
    ).toEqual([]);
  });
});
