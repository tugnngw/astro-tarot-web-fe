// Ghi công ảnh minh hoạ.
//
// Năm trong số ảnh ở public/products/ dùng giấy phép CC BY hoặc CC BY-SA.
// Hai giấy phép này BẮT BUỘC ghi tên tác giả và giấy phép ở nơi người xem
// thấy được — không phải ở một tệp README trong mã nguồn mà chỉ lập trình
// viên mở. public/products/README.md đã ghi là cần trang này "trước khi chạy
// thật", nhưng trang đã chạy thật từ lâu, nên đây là một nghĩa vụ đang nợ.
//
// CC0 và public domain không bắt buộc ghi, vẫn liệt kê cho đủ: người đọc
// không phải đoán ảnh nào có nguồn gốc rõ, ảnh nào không.
//
// Cố ý không bọc RoleGuard: một trang ghi công mà phải đăng nhập mới xem được
// thì không làm tròn nghĩa vụ ghi công.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Images } from "lucide-react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/ghi-cong")({
  head: () => ({
    meta: [
      { title: "Ghi công hình ảnh — ASTROTAROT" },
      {
        name: "description",
        content:
          "Nguồn và giấy phép của các ảnh minh hoạ dùng trong mục Cửa hàng của ASTROTAROT.",
      },
    ],
  }),
  component: TrangGhiCong,
});

interface Anh {
  /** Tên sản phẩm đang hiện ảnh này. */
  dung: string;
  /** Tên tệp gốc trên Wikimedia Commons. */
  goc: string;
  tacGia: string;
  giayPhep: string;
  /** true khi giấy phép BẮT BUỘC ghi công (CC BY, CC BY-SA). */
  batBuoc: boolean;
}

/**
 * Chép từ bảng trong `public/products/README.md`.
 *
 * Giữ hai bản là có chủ ý: README là bản ghi cho người sửa mã, trang này là
 * bản cho người đọc. Thay ảnh nào thì sửa cả hai.
 */
const ANH: Anh[] = [
  {
    dung: "Thoth Tarot — Aleister Crowley",
    goc: "Tarot cards - Celtic cross spread.jpg",
    tacGia: "Nosferattus",
    giayPhep: "CC0",
    batBuoc: false,
  },
  {
    dung: "Wild Unknown Tarot",
    goc: "Tarot cards - 3 card spread.jpg",
    tacGia: "Nosferattus",
    giayPhep: "CC0",
    batBuoc: false,
  },
  {
    dung: "Maybe Lenormand",
    goc: "Tarot cards - 3 card spread with candles.jpg",
    tacGia: "Nosferattus",
    giayPhep: "CC0",
    batBuoc: false,
  },
  {
    dung: "Blue Owl Lenormand",
    goc: "Lenormand.jpg",
    tacGia: "FIST (Wikipedia tiếng Đức)",
    giayPhep: "Public domain",
    batBuoc: false,
  },
  {
    dung: "Moonology Oracle — 44 lá",
    goc: "Moon Phase (PSF).png",
    tacGia: "Pearson Scott Foresman",
    giayPhep: "Public domain",
    batBuoc: false,
  },
  {
    dung: "Thạch anh tím — trụ tự nhiên 500g",
    goc: "Amethyst Druse.jpg",
    tacGia: "Ra'ike",
    giayPhep: "CC BY 2.5",
    batBuoc: true,
  },
  {
    dung: "Vòng tay thạch anh hồng 8mm",
    goc: "Rose quartz pebbles.jpg",
    tacGia: "Mauro Cateb",
    giayPhep: "CC BY-SA 3.0",
    batBuoc: true,
  },
  {
    dung: "Đá mặt trăng — set 3 viên",
    goc: "Moonstone.cabochons.arp.jpg",
    tacGia: "Arpingstone",
    giayPhep: "Public domain",
    batBuoc: false,
  },
  {
    dung: "Hộp gỗ đựng bài — khắc mặt trăng",
    goc: "Carved Wooden Bowl With Lid (30646940752).jpg",
    tacGia: "Archives New Zealand",
    giayPhep: "CC BY 2.0",
    batBuoc: true,
  },
  {
    dung: "Khăn trải bài nhung — thêu cung hoàng đạo",
    goc: "Silk Fabric (7194805316) (2).jpg",
    tacGia: "David Schroeter",
    giayPhep: "CC BY-SA 2.0",
    batBuoc: true,
  },
  {
    dung: "Nến thơm trầm hương — 200g",
    goc: "Scented candle.jpg",
    tacGia: "MichalPL",
    giayPhep: "CC BY-SA 4.0",
    batBuoc: true,
  },
];

/** Trang gốc của một tệp trên Commons. */
function duongDanCommons(tenTep: string) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(
    tenTep.replace(/ /g, "_"),
  )}`;
}

function TrangGhiCong() {
  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Về Cửa hàng
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <Images className="h-6 w-6 text-gold" />
          <h1 className="font-display text-3xl">Ghi công hình ảnh</h1>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Phần lớn ảnh trong mục Cửa hàng là{" "}
            <strong className="text-foreground">ảnh minh hoạ</strong>: ảnh của
            một món tương tự, không phải ảnh chụp đúng món đang bán. Chỗ nào
            như vậy đều có nhãn "Ảnh minh hoạ" ngay trên ảnh — gắn ảnh không
            đúng món mà im lặng là mô tả sai hàng.
          </p>
          <p>
            Ảnh sản phẩm của các bộ bài thương mại thuộc bản quyền nhà xuất
            bản, nên không lấy trên mạng về dùng được. Những ảnh dưới đây lấy
            từ Wikimedia Commons, đều có giấy phép cho phép dùng lại.
          </p>
          <p>
            Riêng <strong className="text-foreground">Rider-Waite Tarot</strong>{" "}
            là ảnh thật của đúng bộ bài đang bán: lá The Magician, bộ
            Rider-Waite-Smith bản 1909, đã hết hạn bản quyền.
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {ANH.map((a) => (
            <li
              key={a.goc}
              className="glass rounded-2xl border border-mystic/30 px-4 py-3.5"
            >
              <p className="text-sm font-medium text-foreground">{a.dung}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                <a
                  href={duongDanCommons(a.goc)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold/90 underline-offset-2 hover:underline"
                >
                  {a.goc}
                </a>{" "}
                — {a.tacGia} — {a.giayPhep}
                {a.batBuoc && (
                  <span className="ml-1.5 text-muted-foreground/70">
                    (giấy phép yêu cầu ghi công)
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground/80">
          Ảnh nào được thay bằng ảnh thật do nhà cung cấp cấp hoặc tự chụp thì
          nhãn "Ảnh minh hoạ" biến mất và dòng tương ứng ở đây cũng được gỡ.
        </p>
      </main>
    </div>
  );
}
