/**
 * Âm thanh của bàn Giao Hội.
 *
 * ## Vì sao tự tổng hợp chứ không tải tệp mp3
 *
 * Một bàn xếp-ba cần khoảng tám tiếng khác nhau. Thu sẵn thành tệp thì đó là
 * vài trăm ki-lô-bai phải tải về trước khi nghe được tiếng đầu tiên, cộng với
 * chuyện bản quyền của từng tiếng. Tổng hợp bằng Web Audio thì cả bộ nằm gọn
 * trong tệp này, chạy được khi mất mạng, và không phải ghi công ai.
 *
 * Nhưng lý do chính không phải dung lượng: **tệp thu sẵn không lên giọng
 * được**. Thứ khiến một dây chuyền bốn bậc nghe đã tai là mỗi bậc kêu cao hơn
 * bậc trước một quãng — tai nghe ra ngay là chuỗi chưa dứt, và bậc cuối là
 * điểm cao nhất. Muốn làm bằng tệp thì phải thu sẵn tám cao độ của cùng một
 * tiếng. Tổng hợp thì chỉ là một phép nhân.
 *
 * ## Vì sao âm giai ngũ cung
 *
 * Các bậc của một dây chuyền chồng lên nhau, và tiếng của bậc trước chưa tắt
 * thì bậc sau đã kêu. Lấy nốt bừa thì sớm muộn cũng có hai nốt cách nhau nửa
 * cung vang cùng lúc — tai nghe ra là sai, dù không ai gọi tên được.
 *
 * Âm giai ngũ cung thứ không có quãng nửa cung nào, nên mọi tổ hợp nốt trong
 * đó đều thuận tai. Đây là mẹo cũ của nhạc trò chơi: không cần biết bậc nào
 * sẽ chồng lên bậc nào mà vẫn chắc chắn không có hợp âm nào chối tai.
 *
 * ## Vì sao AudioContext dựng muộn
 *
 * Trình duyệt chặn phát tiếng trước khi người dùng chạm vào trang. Dựng
 * AudioContext lúc tải trang thì nó ở trạng thái `suspended`, và mọi tiếng
 * phát trước cú chạm đầu tiên đều im lặng biến mất. Nên ở đây dựng vào lần
 * phát đầu tiên và `resume()` mỗi lần phát — gọi thừa thì không tốn gì.
 */

/** Cài đặt người chơi chỉnh được. */
export type CaiDatAm = {
  bat: boolean;
  /** 0 đến 1. */
  muc: number;
};

export const AM_MAC_DINH: CaiDatAm = { bat: true, muc: 0.55 };

const KHOA_LUU = "giaohoi.am";

/** Giữ mức trong khoảng hợp lệ. Ô trượt hỏng hoặc dữ liệu cũ đều về đây. */
export function kepMuc(m: number): number {
  if (!Number.isFinite(m)) return AM_MAC_DINH.muc;
  return Math.min(1, Math.max(0, m));
}

/**
 * Đọc cài đặt đã lưu.
 *
 * Mọi lối ra đều phải trả về một cài đặt dùng được: localStorage có thể ném
 * lỗi (cửa sổ ẩn danh, trình duyệt chặn dữ liệu trang), có thể trả về chuỗi
 * không phải JSON, hoặc JSON của một phiên bản cũ thiếu trường.
 */
export function docCaiDat(): CaiDatAm {
  try {
    const s = localStorage.getItem(KHOA_LUU);
    if (!s) return AM_MAC_DINH;
    const o: unknown = JSON.parse(s);
    if (typeof o !== "object" || o === null) return AM_MAC_DINH;
    const b = (o as { bat?: unknown }).bat;
    const m = (o as { muc?: unknown }).muc;
    return {
      bat: typeof b === "boolean" ? b : AM_MAC_DINH.bat,
      muc: kepMuc(typeof m === "number" ? m : AM_MAC_DINH.muc),
    };
  } catch {
    return AM_MAC_DINH;
  }
}

export function luuCaiDat(c: CaiDatAm): void {
  try {
    localStorage.setItem(KHOA_LUU, JSON.stringify(c));
  } catch {
    // Không lưu được thì thôi; cài đặt vẫn có tác dụng trong phiên này.
  }
}

/**
 * Các bậc của âm giai ngũ cung thứ, tính bằng nửa cung từ nốt gốc.
 *
 * Dây chuyền leo theo đúng thang này chứ không leo đều hai nửa cung một bậc.
 * Leo đều thì bậc một ở nửa cung thứ 2 còn hợp âm của bậc không có nốt ở nửa
 * cung thứ 3 — hai nốt cách nhau nửa cung vang chồng lên nhau, đúng cái thứ
 * mà cả đoạn chú thích đầu tệp nói là tránh được. Đi theo thang này thì mọi
 * nốt của mọi bậc đều rút từ CÙNG một âm giai, nên bậc nào chồng lên bậc nào
 * cũng không sinh ra quãng nửa cung.
 */
const THANG = [0, 3, 5, 7, 10];

/** Bậc cao nhất được leo tới. Bảy bậc là chừng một quãng tám rưỡi. */
const BAC_TOI_DA = 7;

/**
 * Đổi **bậc của thang** ra nửa cung.
 *
 * ## Vì sao phải đếm bằng bậc chứ không bằng nửa cung
 *
 * Đây là chỗ đã làm sai một lần, và cái sai ấy nghe ra được chứ không chỉ là
 * chuyện lý thuyết.
 *
 * Ý định ban đầu: dây chuyền leo theo ngũ cung, hợp âm của mỗi bậc nổ cũng
 * lấy nốt trong ngũ cung. Nghe thì tưởng đủ. Nhưng **ngũ cung không bất biến
 * qua phép dịch giọng** — dịch cả hợp âm lên một bậc ngũ cung thì nó rơi ra
 * ngoài thang. Cụ thể: bậc một của dây chuyền bắt đầu ở nửa cung thứ 3, cộng
 * nốt 15 của hợp âm bậc ba ra 18 ≡ 6, một nốt không có trong thang và cách
 * cả nốt 5 lẫn nốt 7 đúng nửa cung.
 *
 * Cách chữa là đừng bao giờ cộng nửa cung với nửa cung. Mọi thứ đánh số bằng
 * BẬC của thang, rồi chỉ đổi ra nửa cung ở đúng một chỗ: hàm này. Khi ấy mọi
 * nốt phát ra đều là một bậc nào đó của cùng một thang, nên không có đường
 * nào sinh ra quãng nửa cung — không phải vì ai nhớ kiểm, mà vì cộng hai bậc
 * lại thì vẫn ra một bậc.
 */
export function nuaCungCuaBac(bac: number): number {
  const quangTam = Math.floor(bac / THANG.length);
  return THANG[bac - quangTam * THANG.length] + 12 * quangTam;
}

/** Bậc thang mà bước thứ `buoc` của dây chuyền bắt đầu. */
export function bacCuaBuoc(buoc: number): number {
  return Math.min(Math.max(0, buoc), BAC_TOI_DA);
}

/**
 * Nốt gốc của bậc thứ `buoc` trong một dây chuyền, tính bằng Hz.
 *
 * Chặn ở {@link BAC_TOI_DA}: máy chủ không hứa dây chuyền dài tối đa bao
 * nhiêu, mà không chặn thì một dây chuyền mười hai bậc kết thúc ở chỗ chỉ còn
 * là tiếng còi.
 */
export function tanSoBuoc(goc: number, buoc: number): number {
  return goc * Math.pow(2, nuaCungCuaBac(bacCuaBuoc(buoc)) / 12);
}

/**
 * Hợp âm của một bậc nổ, tính bằng **bậc thang** so với nốt gốc của bước.
 *
 * Cộng vào bậc của bước rồi mới đổi ra nửa cung qua {@link nuaCungCuaBac} —
 * xem chú thích ở đó về lý do không được cộng nửa cung.
 *
 * Nổ càng lớn hợp âm càng dày: một nốt trơ, rồi thêm quãng năm, rồi thêm
 * quãng tám, rồi thêm một nốt nữa phía trên. Dày dần như vậy thì tai nghe ra
 * "to hơn" mà không cần vặn to hơn — vặn to chỉ làm chói.
 */
export function hopAmCuaBac(bac: 0 | 1 | 2 | 3): number[] {
  switch (bac) {
    case 0:
      return [0];
    case 1:
      return [0, 3];
    case 2:
      return [0, 3, 5];
    case 3:
      return [0, 3, 5, 7];
  }
}

/** Nốt gốc của tiếng ô nổ. Mi quãng tám thứ tư — đủ trong, không chói. */
const GOC_NO = 330;

type Giong = OscillatorType;

/**
 * Câu hô.
 *
 * ## Vì sao có giọng người, khi đã có hợp âm
 *
 * Hợp âm nói được "to hay nhỏ" nhưng không nói được "cái gì". Người chơi xếp
 * được chín ô nghe thấy một hợp âm dày hơn, và vẫn không biết mình vừa làm
 * được một việc có tên. Một giọng hô "Tinh Hà!" thì vừa khen vừa dạy tên gọi,
 * trong nửa giây, không chiếm một milimet màn hình nào.
 *
 * ## Vì sao là giọng tự sinh chứ không phải tiếng lấy từ game khác
 *
 * Tiếng hô của những trò quen thuộc đều có bản quyền. Đưa lên CH Play là rủi
 * ro thật chứ không phải chuyện lý thuyết. Mấy tệp trong `public/tieng-game`
 * sinh bằng bộ đọc của Microsoft Edge (giọng `vi-VN-NamMinhNeural`), nói
 * nhanh hơn và cao hơn giọng đọc thường để ra chất hô trong trận, rồi cắt
 * khoảng lặng hai đầu — bộ đọc ấy chèn sẵn gần một giây im, để nguyên thì câu
 * hô vang sau cú nổ cả nhịp.
 *
 * Muốn thay bằng giọng người thật thì chỉ việc ghi đè tám tệp ấy, không phải
 * sửa một dòng mã nào.
 */
export type TenHo =
  | "tam-hop"
  | "thien-trieu"
  | "tinh-ha"
  | "tuyet-voi"
  | "khong-the-tin"
  | "trieu-am"
  | "quang-phat"
  | "thap-tinh";

const THU_MUC_HO = "/tieng-game";

/**
 * Chọn câu hô cho một bậc nổ.
 *
 * Một sự kiện chỉ được MỘT câu. Hô chồng lên nhau thì không nghe ra câu nào,
 * và cái cảm giác "mình vừa làm được gì ghê gớm" biến thành tiếng ồn.
 *
 * Thứ tự ưu tiên là theo độ hiếm: dây chuyền dài hiếm hơn một cú nổ to, nên
 * nó giành quyền nói. Chuỗi ba thường thì im — có tiếng hô ở mọi nước đi thì
 * chẳng nước nào còn đáng kể.
 */
export function cauHoCuaBac(bac: 0 | 1 | 2 | 3, buoc: number): TenHo | null {
  if (buoc >= 4) return "khong-the-tin";
  if (buoc >= 2) return "tuyet-voi";
  if (bac === 3) return "tinh-ha";
  if (bac === 2) return "thien-trieu";
  if (bac === 1) return "tam-hop";
  return null;
}

/**
 * Câu hô khi một người đồng hành ra kĩ năng: tên chiêu của chính họ.
 *
 * Kĩ năng phải nạp cả chục lượt mới có một lần, nên nó luôn đáng một câu —
 * không như chuỗi ba.
 */
export function cauHoCuaKiNang(ma: string): TenHo | null {
  switch (ma) {
    case "LUNA":
      return "trieu-am";
    case "SOL":
      return "quang-phat";
    case "ASTRA":
      return "thap-tinh";
    default:
      return null;
  }
}

/** Bộ phát tiếng. Dựng một cái duy nhất cho cả trang. */
export class BoAm {
  private ctx: AudioContext | null = null;
  private chinh: GainNode | null = null;
  private caiDat: CaiDatAm = AM_MAC_DINH;
  private cacHo = new Map<TenHo, HTMLAudioElement>();
  private dangHo: HTMLAudioElement | null = null;

  constructor(caiDat?: CaiDatAm) {
    if (caiDat) this.caiDat = caiDat;
  }

  datCaiDat(c: CaiDatAm) {
    this.caiDat = c;
    // Tắt tiếng phải im NGAY, kể cả câu đang hô dở. Chỉ hạ mức chung thì
    // giọng vẫn nói nốt, vì nó không đi qua đồ thị âm thanh.
    if (!c.bat && this.dangHo) {
      this.dangHo.pause();
      this.dangHo.currentTime = 0;
    }
    if (this.chinh && this.ctx) {
      // Đổi mức ngay nhưng không nhảy bậc: nhảy biên độ đột ngột trong Web
      // Audio nghe thành một tiếng "tách".
      this.chinh.gain.setTargetAtTime(
        c.bat ? c.muc : 0,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  /** Mở máy. Gọi trong một trình xử lý sự kiện của người dùng thì mới ăn. */
  danhThuc() {
    this.may();
  }

  private may(): { ctx: AudioContext; chinh: GainNode } | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Lop =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Lop) return null;
      try {
        this.ctx = new Lop();
      } catch {
        return null;
      }
      this.chinh = this.ctx.createGain();
      this.chinh.gain.value = this.caiDat.bat ? this.caiDat.muc : 0;
      this.chinh.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.chinh ? { ctx: this.ctx, chinh: this.chinh } : null;
  }

  /**
   * Một nốt.
   *
   * `tre` cho phép rải các nốt của một hợp âm ra vài chục mili giây. Đánh
   * cùng lúc tuyệt đối thì nghe như một tiếng bíp tổng hợp; rải ra một chút
   * thì nghe ra từng nốt, giống tay người gảy.
   */
  private not(
    hz: number,
    dai: number,
    manh: number,
    giong: Giong = "sine",
    tre = 0,
  ) {
    const m = this.may();
    if (!m || !this.caiDat.bat) return;
    const { ctx, chinh } = m;
    const t = ctx.currentTime + tre;

    const dao = ctx.createOscillator();
    const am = ctx.createGain();
    dao.type = giong;
    dao.frequency.setValueAtTime(hz, t);

    // Vào nhanh, tắt theo hàm mũ. Tắt tuyến tính nghe như bị cắt ngang; tai
    // người nghe độ to theo hàm mũ nên đuôi mũ mới ra tiếng chuông.
    am.gain.setValueAtTime(0.0001, t);
    am.gain.exponentialRampToValueAtTime(manh, t + 0.008);
    am.gain.exponentialRampToValueAtTime(0.0001, t + dai);

    dao.connect(am);
    am.connect(chinh);
    dao.start(t);
    dao.stop(t + dai + 0.02);
  }

  /**
   * Hô một câu.
   *
   * Mỗi tệp giữ lại sau lần phát đầu nên lần sau không phải tải lại. Phát
   * bằng `<audio>` chứ không qua AudioContext: tệp nén, giải mã nó rồi nhét
   * vào đồ thị âm thanh chỉ để chỉnh to nhỏ là việc thừa.
   *
   * Cắt câu đang hô trước khi hô câu mới — hai giọng chồng lên nhau nghe như
   * nhiễu chứ không ra hai lời khen.
   */
  ho(ten: TenHo) {
    if (!this.caiDat.bat || typeof Audio === "undefined") return;
    let a = this.cacHo.get(ten);
    if (!a) {
      a = new Audio(`${THU_MUC_HO}/${ten}.mp3`);
      a.preload = "auto";
      this.cacHo.set(ten, a);
    }
    if (this.dangHo && this.dangHo !== a) {
      this.dangHo.pause();
      this.dangHo.currentTime = 0;
    }
    this.dangHo = a;
    a.currentTime = 0;
    // Giọng hô để dưới mức chung một chút: nó vốn đã nổi hơn tiếng tổng hợp,
    // để ngang nhau là nó át hết phần còn lại.
    a.volume = kepMuc(this.caiDat.muc * 0.8);
    void a.play().catch(() => {
      // Trình duyệt chặn vì chưa có cú chạm nào, hoặc tệp chưa tải xong.
      // Mất một câu hô thì không sao; đừng để nó làm hỏng nước đi.
    });
  }

  /** Tần số của một bậc thang, tính từ nốt gốc của bàn. */
  private hz(bac: number): number {
    return GOC_NO * Math.pow(2, nuaCungCuaBac(bac) / 12);
  }

  /** Tiếng hai ô trượt đổi chỗ. Rất ngắn, rất nhẹ — nó kêu mỗi nước đi. */
  truot() {
    this.not(520, 0.07, 0.1, "triangle");
  }

  /** Nước đi không hợp lệ: hai nốt đi xuống. */
  hong() {
    this.not(200, 0.1, 0.12, "sawtooth");
    this.not(150, 0.16, 0.1, "sawtooth", 0.07);
  }

  /**
   * Một bậc của dây chuyền nổ.
   *
   * `buoc` là bậc thứ mấy trong dây chuyền (0 là bậc đầu). Nó đẩy cao độ lên,
   * nên dây chuyền càng dài thì tiếng càng leo cao.
   */
  no(bac: 0 | 1 | 2 | 3, buoc: number) {
    const bacDau = bacCuaBuoc(buoc);
    const hop = hopAmCuaBac(bac);
    const dai = 0.2 + bac * 0.12;
    hop.forEach((lech, i) => {
      this.not(this.hz(bacDau + lech), dai, 0.16 - i * 0.02, "sine", i * 0.022);
    });
    // Cú nổ lớn thêm một tiếng trầm bên dưới. Đây là phần người chơi cảm thấy
    // hơn là nghe thấy — nó cho cú nổ có sức nặng mà không cần to hơn.
    // Chia bốn là hạ đúng hai quãng tám, nên nốt trầm vẫn là nốt ấy.
    if (bac >= 2) this.not(this.hz(bacDau) / 4, 0.3, 0.2, "sine");
  }

  /** Phát kĩ năng: một nét chạy lên rồi vỡ ra thành hợp âm. */
  kiNang() {
    for (let b = 0; b <= 5; b++) {
      this.not(this.hz(b), 0.12, 0.11, "triangle", b * 0.04);
    }
    [0, 3, 5, 8].forEach((b, i) => {
      this.not(this.hz(b), 0.6, 0.14, "sine", 0.26 + i * 0.025);
    });
    this.not(this.hz(0) / 4, 0.5, 0.22, "sine", 0.26);
  }

  /** Vừa đổi đủ điểm lấy một lượt Tarot AI. */
  thuong() {
    [0, 2, 4, 6, 8].forEach((b, i) => {
      this.not(this.hz(b) * 2, 0.45, 0.14, "sine", i * 0.075);
    });
  }

  /** Hết lượt. Đi xuống, không buồn thảm — chỉ là dấu chấm hết. */
  het() {
    [5, 3, 1, 0].forEach((b, i) => {
      this.not(this.hz(b), 0.35, 0.12, "sine", i * 0.1);
    });
  }
}
