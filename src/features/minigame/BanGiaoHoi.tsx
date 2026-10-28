import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  doiCho as goiDoiCho,
  dungKiNang as goiKiNang,
  type BuocXoa,
  type Phien,
  type Thuong,
} from "@/api/game";
import { so } from "@/lib/tien";
import { AnhNhanVat } from "./AnhNhanVat";
import { BieuTuongO } from "./BieuTuongO";
import { cauHoCuaBac, cauHoCuaKiNang } from "./am-thanh";
import { DieuKhienAmThanh } from "./DieuKhienAmThanh";
import { useAmThanh } from "./dung-am-thanh";
import {
  doiHaiO,
  keNhau,
  laKyTuO,
  lechKhiKeo,
  MS_GIU_BANG,
  mucDoNo,
  NGUONG_RUNG,
  NHIP_GIAM,
  nhipCuaBac,
  oTheoHuong,
  phanTramNap,
  tamCacO,
  tamTrongBan,
  tenLoai,
  TI_LE_CHOT,
  tinhDuongRoi,
  type NguonO,
} from "./giao-hoi";

/** Nhịp hoạt ảnh đang hiện trên bàn. */
type Nhip = {
  bang: string;
  dangXoa: ReadonlySet<number>;
  /** Ô này vốn ở hàng nào; null nghĩa là ô mới. Null cả mảng khi không đang rơi. */
  nguon: NguonO[] | null;
  /** Tăng mỗi lần rơi; nằm trong key của ô để hoạt ảnh diễn lại từ đầu. */
  khoa: number;
  /** Bậc của cú nổ đang diễn: ô nổ to hay nổ nhẹ tuỳ con số này. */
  bacNo: 0 | 1 | 2 | 3;
};

/** Cú nổ đang diễn ra, để vẽ vòng sáng và gọi tên nó. */
type No = {
  bac: 0 | 1 | 2 | 3;
  ten: string | null;
  /** Tâm đám ô vừa nổ, theo phần trăm bề ngang và bề cao bàn. */
  tam: { x: number; y: number } | null;
  id: number;
};

/** Một dòng trên bảng thành tích bên cạnh bàn. */
type DongNo = {
  id: number;
  ten: string | null;
  bac: 0 | 1 | 2 | 3;
  soO: number;
  heSo: number;
  diem: number;
};

/** Cú kéo đang diễn ra, hoặc cú trượt đang chạy nốt sau khi thả tay. */
type Keo = {
  tuO: number;
  /** Ô sẽ đổi chỗ với nó; null khi chưa rõ hướng hoặc hướng ấy ra ngoài bàn. */
  oDich: number | null;
  x: number;
  y: number;
  /** Đã thả tay: từ đây ô tự trượt, nên bật chuyển động mượt. */
  dangTha: boolean;
};

/** Hai ô đổi chỗ cho nhau mất bấy nhiêu. */
const MS_TRUOT = 140;

const RONG = new Set<number>();

/** Bàn rung từ bậc này trở lên. Rung cả ở chuỗi ba thì cả ván chỉ thấy rung. */
const BAC_RUNG = 2;

/**
 * Cỡ chữ của con số điểm, theo bậc cú nổ.
 *
 * Chuỗi ba thì chỉ một con số nhỏ bay lên — nó xảy ra mỗi lượt, làm to là
 * mỗi lượt đều bị một khung chữ che mất bàn. Nổ càng lớn thì con số càng to,
 * nên độ lớn trên màn hình tự nó đã nói lên mình vừa ăn được bao nhiêu, trước
 * cả khi kịp đọc chữ số.
 */
const CO_DIEM: Record<0 | 1 | 2 | 3, string> = {
  0: "text-xl",
  1: "text-2xl",
  2: "text-3xl",
  3: "text-4xl",
};

function nghi(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Người dùng có bật "giảm chuyển động" ở hệ điều hành không.
 *
 * Một bàn xếp-ba là chuyển động gần như liên tục: ô nổ, ô rơi, ô mới trượt
 * vào. Với người say chuyển động thì đó không phải "hơi nhiều hiệu ứng" mà là
 * chóng mặt thật. Nhưng tắt hẳn hoạt ảnh thì họ cũng mất luôn thông tin — bàn
 * đổi một cái, không biết vừa ăn chuỗi nào. Nên ở đây chỉ bỏ phần CHUYỂN
 * ĐỘNG, vẫn giữ từng bậc dây chuyền thành những nhịp tách rời.
 */
function useGiamChuyenDong(): boolean {
  const [giam, setGiam] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setGiam(mq.matches);
    const doi = (e: MediaQueryListEvent) => setGiam(e.matches);
    mq.addEventListener("change", doi);
    return () => mq.removeEventListener("change", doi);
  }, []);
  return giam;
}

/**
 * Cạnh một ô, tính bằng pixel.
 *
 * Cần con số thật vì cú kéo đo bằng pixel của ngón tay, mà lưới thì co giãn
 * theo bề ngang màn hình. Đoán một con số cố định thì trên màn hẹp ngưỡng chốt
 * nước đi thành quá xa, còn trên màn rộng thì chạm nhẹ đã ăn nước đi.
 */
function useCanhO(canhBan: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [canhO, setCanhO] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const do_ = () => setCanhO(el.getBoundingClientRect().width / canhBan);
    do_();
    const ro = new ResizeObserver(do_);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canhBan]);
  return { ref, canhO };
}

export function BanGiaoHoi({
  phien,
  canhBan,
  onPhien,
  onThuong,
}: {
  phien: Phien;
  canhBan: number;
  onPhien: (p: Phien) => void;
  onThuong: (t: Thuong) => void;
}) {
  const [nhip, setNhip] = useState<Nhip>({
    bang: phien.bang,
    dangXoa: RONG,
    nguon: null,
    khoa: 0,
    bacNo: 0,
  });
  const [keo, setKeo] = useState<Keo | null>(null);
  const [chon, setChon] = useState<number | null>(null);
  const [ngamKiNang, setNgamKiNang] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [bacDangAn, setBacDangAn] = useState<BuocXoa | null>(null);
  const [no, setNo] = useState<No | null>(null);
  const [cacDong, setCacDong] = useState<DongNo[]>([]);
  const [baoDaoBan, setBaoDaoBan] = useState(false);

  const giam = useGiamChuyenDong();
  const {
    am,
    caiDat: amCaiDat,
    datBat: amDatBat,
    datMuc: amDatMuc,
  } = useAmThanh();
  const { ref: luoiRef, canhO } = useCanhO(canhBan);
  const batDau = useRef<{ x: number; y: number } | null>(null);

  // Bộ đếm nằm ở ref chứ không đọc ra từ state.
  //
  // Hàm cập nhật của setState chạy lúc dựng hình, SAU khi dòng lệnh gọi nó đã
  // đi tiếp. Lấy giá trị ra từ trong ấy rồi dùng ngay ở dòng dưới là đọc phải
  // con số cũ — và vì nó chỉ là khoá của hoạt ảnh nên hậu quả là ô thỉnh
  // thoảng không diễn lại cú rơi, không có lỗi nào báo.
  const khoaRef = useRef(0);
  const idNo = useRef(0);
  const henXoaBang = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rung = useAnimationControls();
  const khoaMoi = useCallback(() => {
    khoaRef.current += 1;
    return khoaRef.current;
  }, []);

  // Hoạt ảnh chạy bất đồng bộ qua nhiều nhịp setState. Nếu người chơi rời
  // trang giữa lúc ấy thì những setState còn lại gọi trên component đã tháo —
  // React 19 không còn cảnh báo chuyện này, nên nó im lặng rò rỉ.
  const conGan = useRef(true);
  useEffect(() => {
    conGan.current = true;
    return () => {
      conGan.current = false;
      if (henXoaBang.current) clearTimeout(henXoaBang.current);
    };
  }, []);

  // Phiên đổi từ ngoài (bấm Chơi lại) thì bàn phải theo, và mọi thứ đang
  // chọn phải bỏ — giữ lại ô đang chọn của bàn cũ là chỉ vào một ô khác hẳn.
  //
  // Chỉ phụ thuộc vào ID PHIÊN, không phụ thuộc vào bàn. Trước đây có cả
  // `phien.bang` trong danh sách, mà bàn thì đổi sau MỖI nước đi — nên lần
  // dọn này chạy ngay sau mỗi nước, xoá sạch bảng thành tích vừa dựng xong.
  // Nhìn ra thì là "bảng không bao giờ hiện", chứ không ai đoán được nguyên
  // nhân nằm ở một danh sách phụ thuộc.
  //
  // Bàn đọc qua ref để lint không đòi thêm nó vào danh sách: ref không phải
  // thứ gây chạy lại, mà vẫn luôn mang giá trị mới nhất.
  const idPhien = phien.id;
  const bangCuaPhien = useRef(phien.bang);
  bangCuaPhien.current = phien.bang;
  useEffect(() => {
    khoaRef.current = 0;
    setNhip({
      bang: bangCuaPhien.current,
      dangXoa: RONG,
      nguon: null,
      khoa: 0,
      bacNo: 0,
    });
    setNo(null);
    setCacDong([]);
    setKeo(null);
    setChon(null);
    setNgamKiNang(false);
    setLoi(null);
    setBacDangAn(null);
  }, [idPhien]);

  const dayDu = phien.nangLuong >= phien.nangLuongCan;
  const khoaBan = dangGui || phien.daChot;
  // Thời lượng hoạt ảnh của từng ô đi theo bậc cú nổ đang diễn, nên nó phải
  // lấy từ cùng một chỗ với nhịp chờ ở dienLai — hai nơi tự tính riêng thì
  // hoạt ảnh và nhịp chờ lệch nhau, ô còn đang tan thì bàn đã rơi.
  const nhipHien = giam ? NHIP_GIAM : nhipCuaBac(nhip.bacNo);

  /**
   * Diễn lại từng bậc dây chuyền máy chủ vừa trả về.
   *
   * Mỗi bậc hai nhịp: ô sáng lên rồi tan, sau đó ô còn lại rơi xuống và ô mới
   * trượt vào. Gộp hai nhịp làm một thì cả bàn đổi trong một khung hình —
   * người chơi không thấy mình vừa ăn chuỗi nào, và dây chuyền ba bậc nhìn
   * y như một bậc.
   */
  const dienLai = useCallback(
    async (cacBuoc: BuocXoa[]) => {
      // Bảng thành tích của nước trước còn đang được giữ lại thì bỏ, nhưng chỉ
      // bỏ ở đây — bỏ ngay lúc người chơi bấm thì bảng biến mất một nhịp rồi
      // mới có cái mới, nhìn như nhấp nháy.
      if (henXoaBang.current) clearTimeout(henXoaBang.current);
      setCacDong([]);

      for (const [buoc, b] of cacBuoc.entries()) {
        if (!conGan.current) return;
        const m = mucDoNo(b.cacOXoa.length);
        const nhip = giam ? NHIP_GIAM : nhipCuaBac(m.bac);
        idNo.current += 1;
        const id = idNo.current;

        // Tiếng kêu đúng lúc ô bắt đầu tan, không sớm hơn không muộn hơn.
        // Lệch đi một hai trăm mili giây là tai nghe ra ngay thành hai sự
        // kiện rời nhau, và cú nổ mất hết sức nặng.
        //
        // Cao độ leo theo `buoc`, nên tai biết dây chuyền còn chạy tiếp mà
        // không cần nhìn: bậc sau bao giờ cũng cao hơn bậc trước.
        am.no(m.bac, buoc);
        const ho = cauHoCuaBac(m.bac, buoc);
        if (ho) am.ho(ho);

        setBacDangAn(b);
        setNo({
          bac: m.bac,
          ten: m.ten,
          tam: tamCacO(b.cacOXoa, canhBan),
          id,
        });
        setCacDong((d) => [
          ...d,
          {
            id,
            ten: m.ten,
            bac: m.bac,
            soO: b.cacOXoa.length,
            heSo: b.heSo,
            diem: b.diem,
          },
        ]);
        setNhip((n) => ({
          ...n,
          dangXoa: new Set(b.cacOXoa),
          nguon: null,
          bacNo: m.bac,
        }));
        if (!giam && m.bac >= BAC_RUNG) {
          void rung.start({
            x: [0, -5, 5, -4, 4, -2, 2, 0],
            transition: { duration: 0.34, ease: "easeOut" },
          });
        }
        await nghi(nhip.tan);

        if (!conGan.current) return;
        setNhip({
          bang: b.bangSau,
          dangXoa: RONG,
          nguon: tinhDuongRoi(b.bangSauXoa, canhBan),
          khoa: khoaMoi(),
          // Giữ nguyên bậc qua cả chặng rơi: thời lượng rơi cũng đi theo bậc,
          // nên đặt về 0 ở đây là cú rơi sau một phát nổ lớn lại vội như sau
          // một chuỗi ba.
          bacNo: m.bac,
        });
        await nghi(nhip.roi);

        // Khoảng lặng sau một cú nổ lớn. Đây mới là thứ cho người chơi kịp
        // thấy mình vừa làm được gì — kéo dài hoạt ảnh chỉ làm mọi thứ chậm
        // chạp, còn một nhịp đứng im thì tách cú nổ ra thành một sự kiện.
        if (nhip.lang > 0) await nghi(nhip.lang);
      }
    },
    [am, canhBan, giam, khoaMoi, rung],
  );

  /** Ghi kết quả một nước đi lên bàn: diễn dây chuyền rồi chốt lại. */
  const nhanKetQua = useCallback(
    async (kq: Awaited<ReturnType<typeof goiDoiCho>>) => {
      await dienLai(kq.cacBuoc);
      if (!conGan.current) return;

      // Chốt lại bằng bàn máy chủ nói là bàn cuối. Dây chuyền có thể kết thúc
      // bằng một lần đảo bàn, mà lần đảo ấy không nằm trong bậc nào.
      setNhip({
        bang: kq.phien.bang,
        dangXoa: RONG,
        nguon: null,
        khoa: khoaMoi(),
        bacNo: 0,
      });
      setBacDangAn(null);
      setNo(null);
      // Bảng thành tích ở lại thêm vài giây. Xoá ngay lúc bàn ngừng động thì
      // nó biến mất đúng lúc người chơi vừa ngẩng lên đọc.
      if (henXoaBang.current) clearTimeout(henXoaBang.current);
      henXoaBang.current = setTimeout(() => {
        if (conGan.current) setCacDong([]);
      }, MS_GIU_BANG);
      setBaoDaoBan(kq.daDaoBan);
      onPhien(kq.phien);
      if (kq.thuong) {
        am.thuong();
        onThuong(kq.thuong);
      } else if (kq.phien.daChot) {
        // Chỉ kêu khi KHÔNG có thưởng: hai tiếng chồng lên nhau thì tiếng
        // thưởng — thứ đáng nghe hơn hẳn — bị tiếng hết lượt nuốt mất.
        am.het();
      }
    },
    [am, dienLai, khoaMoi, onPhien, onThuong],
  );

  /**
   * Đổi chỗ hai ô: cho chúng trượt NGAY, rồi mới chờ máy chủ.
   *
   * ## Vì sao không chờ máy chủ trả lời rồi mới động đậy
   *
   * Luật nằm ở máy chủ, nên cách đơn giản nhất là gọi xong mới vẽ. Nhưng
   * chặng Việt Nam – Render mất một hai trăm mili giây, và trong chừng ấy thời
   * gian bàn đứng im hoàn toàn: người chơi bấm, không có gì xảy ra, một lúc
   * sau bàn mới giật mình nổ một tràng. Cảm giác là ứng dụng bị treo chứ không
   * phải mạng chậm.
   *
   * Đổi chỗ hai ô thì không cần biết luật — chỉ là hoán vị hai hình. Nên cú
   * trượt chạy ngay, còn lượt gọi mạng đi song song. Máy chủ vẫn là nơi duy
   * nhất quyết định nước đi có hợp lệ không và được mấy điểm: nếu nó từ chối,
   * hai ô trượt ngược về chỗ cũ — đúng cái người chơi đã quen ở mọi game xếp
   * ba khác.
   *
   * {@link MS_TRUOT} là sàn, không phải trần: chờ cả hai thứ xong nên lúc mạng
   * nhanh thì dây chuyền nổ ngay sau cú trượt, còn lúc mạng chậm thì cú trượt
   * vẫn chạy trọn chứ không bị cắt ngang.
   */
  const chotNuoc = useCallback(
    async (a: number, b: number) => {
      if (khoaBan || canhO === 0) return;
      const huongX = (b % canhBan) - (a % canhBan);
      const huongY = Math.floor(b / canhBan) - Math.floor(a / canhBan);

      setKeo({
        tuO: a,
        oDich: b,
        x: huongX * canhO,
        y: huongY * canhO,
        dangTha: true,
      });
      setDangGui(true);
      setLoi(null);
      setBaoDaoBan(false);
      setChon(null);
      // Kêu ngay lúc hai ô bắt đầu trượt, không đợi máy chủ. Cùng lý do với
      // cú trượt: chờ mạng rồi mới kêu là người chơi nghe thấy tiếng của một
      // việc họ làm xong từ hai trăm mili giây trước.
      am.truot();

      try {
        const [kq] = await Promise.all([
          goiDoiCho(phien.id, a, b),
          nghi(giam ? 0 : MS_TRUOT),
        ]);
        if (!conGan.current) return;

        // Bỏ độ lệch và viết lại chuỗi bàn trong CÙNG một nhịp dựng hình. Tách
        // ra thì hai ô nháy về chỗ cũ một khung hình rồi mới đổi chỗ thật.
        setNhip((n) => ({ ...n, bang: doiHaiO(n.bang, a, b) }));
        setKeo(null);
        await nhanKetQua(kq);
      } catch (e) {
        if (!conGan.current) return;
        // Máy chủ từ chối: trượt ngược về chỗ cũ.
        am.hong();
        setKeo({ tuO: a, oDich: b, x: 0, y: 0, dangTha: true });
        setLoi(
          e instanceof ApiError
            ? e.message
            : "Không gửi được nước đi. Thử lại nhé.",
        );
        setBacDangAn(null);
      } finally {
        if (conGan.current) setDangGui(false);
      }
    },
    [am, canhBan, canhO, giam, khoaBan, nhanKetQua, phien.id],
  );

  const chotKiNang = useCallback(
    async (o: number) => {
      if (khoaBan) return;
      setDangGui(true);
      setLoi(null);
      setBaoDaoBan(false);
      am.kiNang();
      // Người đồng hành gọi tên chiêu của chính mình. Kĩ năng nạp cả chục
      // lượt mới có một lần nên nó luôn đáng một câu hô.
      const hoChieu = cauHoCuaKiNang(phien.nhanVat.ma);
      if (hoChieu) am.ho(hoChieu);
      try {
        const kq = await goiKiNang(phien.id, o);
        if (!conGan.current) return;
        await nhanKetQua(kq);
      } catch (e) {
        if (!conGan.current) return;
        setLoi(
          e instanceof ApiError
            ? e.message
            : "Không dùng được kĩ năng. Thử lại nhé.",
        );
        setBacDangAn(null);
      } finally {
        if (conGan.current) {
          setDangGui(false);
          setNgamKiNang(false);
        }
      }
    },
    [am, khoaBan, nhanKetQua, phien.id, phien.nhanVat.ma],
  );

  // ----------------------------------------------------------------
  // Bấm và kéo
  // ----------------------------------------------------------------

  /** Một cú chạm gọn, không kéo đi đâu. Giữ lại lối chơi bấm hai ô. */
  function chamO(i: number) {
    if (khoaBan) return;
    setBaoDaoBan(false);

    if (ngamKiNang) {
      void chotKiNang(i);
      return;
    }
    if (chon === null || chon === i) {
      setChon(chon === i ? null : i);
      return;
    }
    if (!keNhau(chon, i, canhBan)) {
      // Chỉ chọn lại chứ không báo lỗi: bấm một ô xa là ý "tôi đổi ý", không
      // phải một nước đi sai.
      setChon(i);
      return;
    }
    void chotNuoc(chon, i);
  }

  function xuongTay(e: React.PointerEvent<HTMLElement>, i: number) {
    if (khoaBan) return;
    // Bắt con trỏ để ngón tay kéo ra khỏi ô vẫn còn nhận được pointermove.
    // Có trường hợp trình duyệt từ chối (con trỏ đã bị nơi khác giữ, hoặc sự
    // kiện không đến từ thiết bị thật) và ném ra — không bắt thì cả hàm chết
    // ngay dòng này, và cú kéo không bao giờ bắt đầu.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* kéo vẫn chạy được, chỉ là ra khỏi ô thì mất dấu */
    }
    batDau.current = { x: e.clientX, y: e.clientY };
    setKeo({ tuO: i, oDich: null, x: 0, y: 0, dangTha: false });
  }

  function diTay(e: React.PointerEvent<HTMLElement>) {
    // Đang ngắm kĩ năng thì không kéo: kĩ năng chỉ cần một ô đích, kéo ô đi
    // chỗ khác là hứa một thứ nó không làm.
    const bd = batDau.current;
    if (!bd || !keo || keo.dangTha || ngamKiNang) return;
    const dx = e.clientX - bd.x;
    const dy = e.clientY - bd.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < NGUONG_RUNG) return;

    const dich = oTheoHuong(keo.tuO, dx, dy, canhBan);
    const lech = lechKhiKeo(dx, dy, canhO, dich !== null);
    setKeo({ ...keo, oDich: dich, ...lech });
  }

  function thaTay() {
    const dangKeo = keo;
    batDau.current = null;
    if (!dangKeo || dangKeo.dangTha) return;

    const quang = Math.max(Math.abs(dangKeo.x), Math.abs(dangKeo.y));
    if (quang < NGUONG_RUNG) {
      setKeo(null);
      chamO(dangKeo.tuO);
      return;
    }
    if (dangKeo.oDich !== null && quang >= canhO * TI_LE_CHOT) {
      void chotNuoc(dangKeo.tuO, dangKeo.oDich);
      return;
    }
    // Kéo chưa đủ xa, hoặc kéo ra ngoài mép: trượt về chỗ cũ.
    setKeo({ ...dangKeo, oDich: null, x: 0, y: 0, dangTha: true });
  }

  /** Độ lệch đang vẽ của một ô. Chỉ hai ô trong cú kéo mới lệch khỏi chỗ. */
  function lechCuaO(i: number): { x: number; y: number } {
    if (!keo) return { x: 0, y: 0 };
    if (i === keo.tuO) return { x: keo.x, y: keo.y };
    if (i === keo.oDich) return { x: -keo.x, y: -keo.y };
    return { x: 0, y: 0 };
  }

  return (
    <div className="flex flex-col gap-3">
      <ThanhKiNang
        phien={phien}
        dayDu={dayDu}
        ngam={ngamKiNang}
        tatCa={khoaBan}
        onNgam={() => setNgamKiNang((v) => !v)}
      />

      {/* Dòng trạng thái nằm TRÊN bàn, không phải dưới.
          Dưới bàn thì nó rơi đúng chỗ nút "Góp ý" nổi ở góc trái màn hình đè
          lên — đã thấy tận mắt: lời từ chối nước đi mất mấy chữ đầu. Trên bàn
          thì nó còn nằm trong tầm mắt người đang nhìn bàn.

          Chiều cao tối thiểu giữ chỗ sẵn cho hai dòng, nếu không thì mỗi lần
          đổi câu dài ngắn khác nhau là cả bàn nhích lên xuống. */}
      <div className="min-h-9">
        {loi ? (
          <p role="status" className="text-xs text-destructive-soft">
            {loi}
          </p>
        ) : baoDaoBan ? (
          <p role="status" className="text-xs text-gold-soft">
            Bàn hết nước đi nên các ô vừa được trộn lại. Số lượng từng loại
            không đổi.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {ngamKiNang
              ? `Chạm một ô để ${phien.nhanVat.tenKiNang} nhắm vào.`
              : "Giữ một ô rồi kéo sang ô bên cạnh. Chạm hai ô lần lượt cũng được."}
          </p>
        )}
      </div>

      {/* Bàn bị chặn bề ngang chứ không giãn hết khung trang.
          Khung trang rộng 768px chia cho bảy cột ra ô 107px — to đến mức trên
          màn hình laptop phải cuộn mới thấy hết bàn, mà xếp ba thì cả bàn phải
          nằm trong một tầm mắt. 420px cho ô chừng 58px: vẫn bấm thoải mái bằng
          ngón tay (ngưỡng 44px), và cả bàn vừa một màn. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-4">
        <div className="relative mx-auto w-full max-w-[420px] lg:mx-0">
          <motion.div
            ref={luoiRef}
            role="grid"
            aria-label="Bàn Giao Hội"
            animate={rung}
            className="relative grid touch-none overflow-hidden rounded-2xl border border-gold/30 bg-card"
            style={{
              gridTemplateColumns: `repeat(${canhBan}, minmax(0, 1fr))`,
            }}
          >
            {Array.from(nhip.bang).map((kyTu, i) => (
              <O
                key={`${nhip.khoa}-${i}`}
                kyTu={kyTu}
                chiSo={i}
                canhBan={canhBan}
                dangXoa={nhip.dangXoa.has(i)}
                bacNo={nhip.bacNo}
                msTan={nhipHien.tan}
                msRoi={nhipHien.roi}
                nguon={nhip.nguon?.[i] ?? null}
                lech={lechCuaO(i)}
                muot={keo?.dangTha ?? true}
                dangKeo={keo?.tuO === i || keo?.oDich === i}
                daChon={chon === i}
                ngam={ngamKiNang}
                tatCa={khoaBan}
                giam={giam}
                onXuongTay={(e) => xuongTay(e, i)}
                onDiTay={diTay}
                onThaTay={thaTay}
                onBanPhim={() => chamO(i)}
              />
            ))}

            {/* Vòng sáng lan ra từ đúng chỗ vừa nổ.
              Nổ càng nhiều ô thì vòng càng lan rộng và càng lâu tan. Đây là
              thứ phân biệt một chuỗi ba với một phát kĩ năng quét mười ba ô —
              trước đó hai chuyện ấy trông y hệt nhau trên màn hình. */}
            {no?.tam && no.bac > 0 && !giam && (
              <motion.span
                key={no.id}
                aria-hidden="true"
                initial={{ scale: 0.25, opacity: 0.7 }}
                animate={{ scale: 1.4 + no.bac * 0.55, opacity: 0 }}
                transition={{ duration: 0.4 + no.bac * 0.12, ease: "easeOut" }}
                style={{ left: `${no.tam.x}%`, top: `${no.tam.y}%` }}
                className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold/50"
              />
            )}
          </motion.div>

          {/* Phần thưởng hiện ra ĐÚNG chỗ vừa nổ.
              Trước đây nó cắm giữa bàn, và bảng bên cạnh thì nằm xa hơn nữa.
              Cả hai chỗ ấy đều bắt mắt rời khỏi nơi người chơi đang nhìn —
              mà nơi ấy mới là chỗ họ vừa xếp xong một hình. Đưa con số về
              đúng đó thì việc mình làm và cái mình được dính liền nhau, không
              phải hai sự kiện ở hai góc màn hình.

              Bảng bên cạnh vẫn giữ, nhưng nó làm việc khác: đọc lại cả dây
              chuyền sau khi bàn đã ngừng. */}
          {/* KHÔNG dùng AnimatePresence ở đây.
              Đã thử và hỏng: mỗi bậc dây chuyền sinh một con số mới, và
              AnimatePresence giữ cả những cái đang diễn hoạt ảnh thoát. Bốn
              bậc liên tiếp để lại bốn con số nằm chồng trên bàn, còn nguyên
              sau khi bàn đã ngừng hẳn. Trước đây không ai thấy vì cả bốn cùng
              cắm giữa bàn, đè khít lên nhau — đưa chúng về đúng chỗ nổ thì
              lỗi lộ ra ngay.

              Thay bằng một phần tử duy nhất mang `key` của cú nổ: đổi khoá là
              React tháo cái cũ dựng cái mới, nên không có đường nào tồn tại
              hai con số một lúc. Hoạt ảnh chạy trọn vòng hiện-rồi-tắt trong
              chính `animate`, nên nó tự tắt đúng lúc bậc sau nổ. */}
          {bacDangAn && bacDangAn.diem > 0 && no && (
            <motion.div
              key={no.id}
              initial={{ opacity: 0, scale: 0.6, y: 0 }}
              animate={{
                opacity: giam ? [0, 1, 1] : [0, 1, 1, 0],
                scale: giam ? [1, 1, 1] : [0.6, 1.08, 1, 0.96],
                y: giam ? [0, 0, 0] : [0, -6, -10, -26],
              }}
              transition={{
                duration: giam
                  ? 0.01
                  : (nhipHien.tan + nhipHien.roi + nhipHien.lang) / 1000,
                // Nảy lên quá cỡ một nhịp rồi mới về: vào thẳng đều đều thì
                // con số chỉ là một thông báo, nảy một cái thì nó là cú đập.
                times: giam ? [0, 0, 1] : [0, 0.14, 0.26, 1],
                ease: "easeOut",
              }}
              style={
                no.tam
                  ? {
                      left: `${tamTrongBan(no.tam, no.bac > 0 ? 26 : 12).x}%`,
                      top: `${tamTrongBan(no.tam, no.bac > 0 ? 18 : 10).y}%`,
                    }
                  : { left: "50%", top: "50%" }
              }
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center ${
                no.bac > 0
                  ? "rounded-xl border border-gold/50 bg-gold/20 px-4 py-2 backdrop-blur-sm"
                  : ""
              }`}
            >
              {no.ten && (
                <div className="font-display text-base leading-tight text-gold-soft">
                  {no.ten}
                </div>
              )}
              <div
                className={`font-display font-semibold text-gold ${CO_DIEM[no.bac]}`}
              >
                +{so(bacDangAn.diem)}
              </div>
              {bacDangAn.bac > 1 && (
                <div className="text-3xs uppercase tracking-wider text-gold-soft">
                  dây chuyền ×{bacDangAn.heSo}
                </div>
              )}
            </motion.div>
          )}

          {dangGui && !bacDangAn && (
            <div className="pointer-events-none absolute right-2 top-2">
              <Loader2 className="size-4 animate-spin text-gold" />
            </div>
          )}
        </div>

        {/* Cột phải: bảng thành tích và nút tiếng.
            Nút tiếng để dưới bảng chứ không trên — thứ người chơi nhìn liên
            tục là bảng, còn nút tiếng chỉnh một lần rồi thôi. Trên màn hẹp cả
            cột này xuống dưới bàn. */}
        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-52">
          <BangThanhTich cacDong={cacDong} giam={giam} />
          <DieuKhienAmThanh
            caiDat={amCaiDat}
            datBat={amDatBat}
            datMuc={amDatMuc}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Bảng thành tích bên cạnh bàn.
 *
 * ## Vì sao cần, khi giữa bàn đã có con số điểm nhảy lên
 *
 * Con số giữa bàn sống đúng bằng một bậc dây chuyền rồi bị bậc sau đè lên.
 * Với dây chuyền bốn bậc thì người chơi thấy bốn con số loé qua và không kịp
 * đọc cái nào — công sức xếp được một hình lớn không đọng lại ở đâu cả.
 *
 * Bảng này thì tích dần: mỗi bậc thêm một dòng, cộng lại thành một tổng, rồi
 * ở lại thêm {@link MS_GIU_BANG} mili giây sau khi bàn đã ngừng động. Người
 * chơi nhìn bàn lúc nó đang chạy, rồi ngẩng sang đây đọc xem vừa xảy ra gì.
 *
 * ## Vì sao lúc trống lại hiện bảng xếp bậc
 *
 * Chỗ này nếu để trắng thì nửa màn hình bỏ không. Mà ba cái tên Tam Hợp,
 * Thiên Triệu, Tinh Hà vốn không có chỗ nào giải thích: người chơi thấy chữ
 * loé lên giữa bàn mà không biết mình đã làm gì để được nó. Để sẵn ở đây thì
 * nó thành mục tiêu, chứ không phải một lời khen bí ẩn.
 */
function BangThanhTich({
  cacDong,
  giam,
}: {
  cacDong: DongNo[];
  giam: boolean;
}) {
  const tong = cacDong.reduce((t, d) => t + d.diem, 0);
  const coDong = cacDong.length > 0;

  return (
    <aside
      aria-live="polite"
      className="w-full shrink-0 rounded-2xl border border-gold/20 bg-card p-3 lg:w-52"
    >
      <h3 className="text-3xs uppercase tracking-wider text-muted-foreground">
        {coDong ? "Dây chuyền" : "Xếp được càng nhiều ô"}
      </h3>

      {coDong ? (
        <>
          <ul className="mt-2 flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {cacDong.map((d, i) => (
                <motion.li
                  key={d.id}
                  initial={giam ? false : { opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: giam ? 0 : 0.22, ease: "easeOut" }}
                  className={`flex items-baseline justify-between gap-2 rounded-lg px-2 py-1 ${
                    d.bac > 0 ? "bg-gold/10" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-xs ${
                        d.ten ? "text-gold" : "text-muted-foreground"
                      }`}
                    >
                      {d.ten ?? `Chuỗi ${so(d.soO)}`}
                    </span>
                    <span className="block text-3xs text-muted-foreground">
                      {so(d.soO)} ô{i > 0 && ` · dây chuyền ×${d.heSo}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-foreground">
                    +{so(d.diem)}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {cacDong.length > 1 && (
            <div className="mt-2 flex items-baseline justify-between border-t border-gold/20 px-2 pt-2">
              <span className="text-3xs uppercase tracking-wider text-muted-foreground">
                Tổng
              </span>
              <span className="font-display text-xl tabular-nums text-gold">
                +{so(tong)}
              </span>
            </div>
          )}
        </>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {BANG_XEP_BAC.map((m) => (
            <li
              key={m.ten}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="text-xs text-gold-soft">{m.ten}</span>
              <span className="shrink-0 text-3xs tabular-nums text-muted-foreground">
                {m.moTa}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

/**
 * Ba bậc, viết lại thành chữ cho người đọc.
 *
 * Con số ở đây phải khớp với ngưỡng trong {@link mucDoNo}. Đó là một chỗ lặp
 * — nhưng lặp có chủ ý: sinh ra chuỗi "4–5 ô" từ ngưỡng thì phải đoán bậc kế
 * tiếp bắt đầu ở đâu, và bậc cuối thì không có cận trên nào để đoán.
 */
const BANG_XEP_BAC = [
  { ten: "Tam Hợp", moTa: "4–5 ô" },
  { ten: "Thiên Triệu", moTa: "6–8 ô" },
  { ten: "Tinh Hà", moTa: "9+ ô" },
] as const;

/**
 * Một ô trên bàn.
 *
 * ## Vì sao lưới không có khoảng cách giữa các ô
 *
 * Hoạt ảnh rơi dịch ô lên theo PHẦN TRĂM chiều cao của chính nó. Nếu lưới có
 * `gap` thì mỗi bậc rơi lệch thêm đúng một khoảng cách ấy, nên ô rơi ba bậc
 * dừng lệch ba khoảng — nhìn như giật. Khoảng cách vì thế nằm trong ô, dưới
 * dạng đệm.
 */
function O({
  kyTu,
  chiSo,
  canhBan,
  dangXoa,
  bacNo,
  msTan,
  msRoi,
  nguon,
  lech,
  muot,
  dangKeo,
  daChon,
  ngam,
  tatCa,
  giam,
  onXuongTay,
  onDiTay,
  onThaTay,
  onBanPhim,
}: {
  kyTu: string;
  chiSo: number;
  canhBan: number;
  dangXoa: boolean;
  /** Bậc của cú nổ ô này đang nằm trong: nổ càng lớn thì bung càng mạnh. */
  bacNo: 0 | 1 | 2 | 3;
  msTan: number;
  msRoi: number;
  nguon: NguonO | null;
  lech: { x: number; y: number };
  /** false khi ngón tay đang kéo: ô phải bám sát tay, không được trễ một nhịp. */
  muot: boolean;
  dangKeo: boolean;
  daChon: boolean;
  ngam: boolean;
  tatCa: boolean;
  giam: boolean;
  onXuongTay: (e: React.PointerEvent<HTMLElement>) => void;
  onDiTay: (e: React.PointerEvent<HTMLElement>) => void;
  onThaTay: () => void;
  onBanPhim: () => void;
}) {
  const hang = Math.floor(chiSo / canhBan);
  const cot = chiSo % canhBan;
  const hopLe = laKyTuO(kyTu);
  const dangLech = lech.x !== 0 || lech.y !== 0;

  // Ô cũ trượt từ chỗ cũ xuống; ô mới vào từ ngoài mép trên.
  let phanTramDau = 0;
  if (nguon) {
    phanTramDau =
      nguon.tuHang === null ? -(hang + 1) * 100 : (nguon.tuHang - hang) * 100;
  }
  const laMoi = nguon?.tuHang === null;

  return (
    <div
      role="gridcell"
      className={`aspect-square p-[2px] ${dangLech || dangKeo ? "z-10" : ""}`}
    >
      <motion.button
        type="button"
        disabled={tatCa || !hopLe}
        onPointerDown={onXuongTay}
        onPointerMove={onDiTay}
        onPointerUp={onThaTay}
        onPointerCancel={onThaTay}
        // Chuột và ngón tay đã xử lý ở onPointerUp; để onClick chạy nữa là một
        // cú chạm thành hai nước đi. `detail === 0` chỉ đúng với click phát ra
        // từ bàn phím (Enter, Space), nên nhánh này dành riêng cho họ.
        onClick={(e) => {
          if (e.detail === 0) onBanPhim();
        }}
        aria-label={
          hopLe
            ? `${tenLoai(kyTu)} — hàng ${hang + 1}, cột ${cot + 1}`
            : `Ô trống — hàng ${hang + 1}, cột ${cot + 1}`
        }
        aria-pressed={daChon}
        initial={{ y: `${phanTramDau}%`, opacity: laMoi ? 0 : 1 }}
        animate={
          dangXoa
            ? {
                // Bung TO ra rồi mới tắt, chứ không teo dần. Teo dần đọc ra
                // là "ô biến mất"; bung ra rồi tắt mới đọc ra là "ô nổ".
                scale: [1, 1.16 + bacNo * 0.1, 0.1],
                opacity: [1, 1, 0],
                rotate: [0, -6, 16 + bacNo * 6],
              }
            : {
                x: lech.x,
                y: lech.y,
                opacity: 1,
                scale: dangKeo && !muot ? 1.06 : 1,
                rotate: 0,
              }
        }
        transition={
          giam
            ? { duration: 0 }
            : dangXoa
              ? {
                  duration: msTan / 1000,
                  times: [0, 0.35, 1],
                  ease: "easeOut",
                }
              : muot
                ? { duration: msRoi / 1000, ease: [0.33, 1.2, 0.68, 1] }
                : // Ngón tay đang kéo: không nội suy gì cả, ô phải ở đúng chỗ
                  // ngón tay đang ở. Có độ trễ dù chỉ một nhịp là thành cảm
                  // giác ô bị dính, nặng tay.
                  { duration: 0 }
        }
        className={`flex size-full touch-none select-none items-center justify-center rounded-lg border transition-colors ${
          dangXoa || daChon
            ? "border-gold/50 bg-gold/20"
            : "border-transparent bg-muted hover:border-gold/30"
        } ${ngam && !tatCa ? "cursor-crosshair hover:bg-gold/10" : ""} ${
          tatCa ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        {hopLe && <BieuTuongO loai={kyTu} className="size-[62%]" />}
      </motion.button>
    </div>
  );
}

function ThanhKiNang({
  phien,
  dayDu,
  ngam,
  tatCa,
  onNgam,
}: {
  phien: Phien;
  dayDu: boolean;
  ngam: boolean;
  tatCa: boolean;
  onNgam: () => void;
}) {
  const pt = phanTramNap(phien.nangLuong, phien.nangLuongCan);
  return (
    <div className="rounded-xl border border-gold/20 bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* Huy hiệu sáng hẳn lên khi nạp đủ — người chơi liếc một cái là
              biết bấm được, không phải đọc con số hay tìm cái nút. */}
          <AnhNhanVat
            ma={phien.nhanVat.ma}
            className={`size-8 shrink-0 transition-opacity ${
              dayDu ? "opacity-100" : "opacity-50"
            }`}
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-base text-gold">
              {phien.nhanVat.tenKiNang}
            </span>
            <span className="block text-2xs text-muted-foreground">
              {phien.nhanVat.ten}
            </span>
          </span>
        </div>
        <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
          {so(phien.nangLuong)}/{so(phien.nangLuongCan)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pt}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Nạp ${phien.nhanVat.tenKiNang}`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className="h-full rounded-full bg-gold"
          animate={{ width: `${pt}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 text-2xs text-muted-foreground">
          {phien.nhanVat.moTaKiNang}
        </p>
        <button
          type="button"
          onClick={onNgam}
          disabled={!dayDu || tatCa}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            ngam
              ? "border-gold/50 bg-gold text-primary-foreground"
              : dayDu && !tatCa
                ? "border-gold/50 bg-gold/20 text-gold hover:bg-gold/10"
                : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <Sparkles className="mr-1 inline size-3" aria-hidden="true" />
          {ngam ? "Chọn ô đích" : dayDu ? "Dùng kĩ năng" : "Chưa nạp đủ"}
        </button>
      </div>
    </div>
  );
}
