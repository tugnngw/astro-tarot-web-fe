import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  doiCho as goiDoiCho,
  dungKiNang as goiKiNang,
  type BuocXoa,
  type NuocDi,
  type Phien,
  type Thuong,
} from "@/api/game";
import { so } from "@/lib/tien";
import { BieuTuongO } from "./BieuTuongO";
import {
  keNhau,
  laKyTuO,
  phanTramNap,
  tenLoai,
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
};

const MS_TAN = 240;
const MS_ROI = 260;

const RONG = new Set<number>();

function nghi(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
  });
  const [chon, setChon] = useState<number | null>(null);
  const [ngamKiNang, setNgamKiNang] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [bacDangAn, setBacDangAn] = useState<BuocXoa | null>(null);
  const [baoDaoBan, setBaoDaoBan] = useState(false);

  // Hoạt ảnh chạy bất đồng bộ qua nhiều nhịp setState. Nếu người chơi rời
  // trang giữa lúc ấy thì những setState còn lại gọi trên component đã tháo —
  // React 19 không còn cảnh báo chuyện này, nên nó im lặng rò rỉ.
  const conGan = useRef(true);
  useEffect(() => {
    conGan.current = true;
    return () => {
      conGan.current = false;
    };
  }, []);

  // Phiên đổi từ ngoài (bấm Chơi lại) thì bàn phải theo, và mọi thứ đang
  // chọn phải bỏ — giữ lại ô đang chọn của bàn cũ là chỉ vào một ô khác hẳn.
  const idPhien = phien.id;
  useEffect(() => {
    setNhip({ bang: phien.bang, dangXoa: RONG, nguon: null, khoa: 0 });
    setChon(null);
    setNgamKiNang(false);
    setLoi(null);
    setBacDangAn(null);
  }, [idPhien, phien.bang]);

  const dayDu = phien.nangLuong >= phien.nangLuongCan;

  /**
   * Diễn lại từng bậc dây chuyền máy chủ vừa trả về.
   *
   * Mỗi bậc hai nhịp: ô sáng lên rồi tan, sau đó ô còn lại rơi xuống và ô mới
   * trượt vào. Gộp hai nhịp làm một thì cả bàn đổi trong một khung hình —
   * người chơi không thấy mình vừa ăn chuỗi nào, và dây chuyền ba bậc nhìn
   * y như một bậc.
   */
  const dienLai = useCallback(
    async (cacBuoc: BuocXoa[], khoaDau: number) => {
      let khoa = khoaDau;
      for (const b of cacBuoc) {
        if (!conGan.current) return khoa;
        setBacDangAn(b);
        setNhip((n) => ({ ...n, dangXoa: new Set(b.cacOXoa), nguon: null }));
        await nghi(MS_TAN);

        if (!conGan.current) return khoa;
        khoa += 1;
        setNhip({
          bang: b.bangSau,
          dangXoa: RONG,
          nguon: tinhDuongRoi(b.bangSauXoa, canhBan),
          khoa,
        });
        await nghi(MS_ROI);
      }
      return khoa;
    },
    [canhBan],
  );

  const chayNuocDi = useCallback(
    async (goi: () => Promise<NuocDi>) => {
      if (dangGui) return;
      setDangGui(true);
      setLoi(null);
      try {
        const kq = await goi();
        const khoaCuoi = await dienLai(kq.cacBuoc, nhip.khoa);
        if (!conGan.current) return;

        // Chốt lại bằng bàn máy chủ nói là bàn cuối. Dây chuyền có thể kết
        // thúc bằng một lần đảo bàn, mà lần đảo ấy không nằm trong bậc nào.
        setNhip({
          bang: kq.phien.bang,
          dangXoa: RONG,
          nguon: null,
          khoa: khoaCuoi + 1,
        });
        setBacDangAn(null);
        setBaoDaoBan(kq.daDaoBan);
        onPhien(kq.phien);
        if (kq.thuong) onThuong(kq.thuong);
      } catch (e) {
        if (!conGan.current) return;
        setLoi(
          e instanceof ApiError
            ? e.message
            : "Không gửi được nước đi. Thử lại nhé.",
        );
        setBacDangAn(null);
      } finally {
        if (conGan.current) {
          setDangGui(false);
          setChon(null);
          setNgamKiNang(false);
        }
      }
    },
    [dangGui, dienLai, nhip.khoa, onPhien, onThuong],
  );

  function bamO(i: number) {
    if (dangGui || phien.daChot) return;
    setBaoDaoBan(false);

    if (ngamKiNang) {
      void chayNuocDi(() => goiKiNang(phien.id, i));
      return;
    }
    if (chon === null) {
      setChon(i);
      return;
    }
    if (chon === i) {
      setChon(null);
      return;
    }
    if (!keNhau(chon, i, canhBan)) {
      // Chỉ chọn lại chứ không báo lỗi: bấm một ô xa là ý "tôi đổi ý", không
      // phải một nước đi sai.
      setChon(i);
      return;
    }
    const a = chon;
    void chayNuocDi(() => goiDoiCho(phien.id, a, i));
  }

  return (
    <div className="flex flex-col gap-3">
      <ThanhKiNang
        phien={phien}
        dayDu={dayDu}
        ngam={ngamKiNang}
        tatCa={dangGui || phien.daChot}
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
              ? `Chọn một ô để ${phien.nhanVat.tenKiNang} nhắm vào.`
              : chon === null
                ? "Bấm một ô, rồi bấm ô kề nó để đổi chỗ."
                : "Bấm một ô kề bên để đổi chỗ, hoặc bấm lại để bỏ chọn."}
          </p>
        )}
      </div>

      {/* Bàn bị chặn bề ngang chứ không giãn hết khung trang.
          Khung trang rộng 768px chia cho bảy cột ra ô 107px — to đến mức trên
          màn hình laptop phải cuộn mới thấy hết bàn, mà xếp ba thì cả bàn phải
          nằm trong một tầm mắt. 420px cho ô chừng 58px: vẫn bấm thoải mái bằng
          ngón tay (ngưỡng 44px), và cả bàn vừa một màn. */}
      <div className="relative mx-auto w-full max-w-[420px]">
        <div
          role="grid"
          aria-label="Bàn Giao Hội"
          className="grid overflow-hidden rounded-2xl border border-gold/30 bg-card"
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
              nguon={nhip.nguon?.[i] ?? null}
              daChon={chon === i}
              ngam={ngamKiNang}
              tatCa={dangGui || phien.daChot}
              onBam={() => bamO(i)}
            />
          ))}
        </div>

        <AnimatePresence>
          {bacDangAn && bacDangAn.diem > 0 && (
            <motion.div
              key={`${bacDangAn.bac}-${bacDangAn.diem}`}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gold/50 bg-gold/20 px-4 py-2 text-center backdrop-blur-sm"
            >
              <div className="font-display text-2xl font-semibold text-gold">
                +{so(bacDangAn.diem)}
              </div>
              {bacDangAn.bac > 1 && (
                <div className="text-3xs uppercase tracking-wider text-gold-soft">
                  dây chuyền ×{bacDangAn.heSo}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {dangGui && !bacDangAn && (
          <div className="pointer-events-none absolute right-2 top-2">
            <Loader2 className="size-4 animate-spin text-gold" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Một ô trên bàn.
 *
 * ## Vì sao lưới không có khoảng cách giữa các ô
 *
 * Hoạt ảnh rơi dịch ô lên theo PHẦN TRĂM chiều cao của chính nó. Nếu lưới có
 * `gap` thì mỗi bậc rơi lệch thêm đúng một khoảng cách ấy, nên ô rơi ba bậc
 * dừng lệch ba khoảng — nhìn như giật. Khoảng cách vì thế nằm trong ô, dưới
 * dạng đệm, và phần trăm lại khớp tuyệt đối.
 */
function O({
  kyTu,
  chiSo,
  canhBan,
  dangXoa,
  nguon,
  daChon,
  ngam,
  tatCa,
  onBam,
}: {
  kyTu: string;
  chiSo: number;
  canhBan: number;
  dangXoa: boolean;
  nguon: NguonO | null;
  daChon: boolean;
  ngam: boolean;
  tatCa: boolean;
  onBam: () => void;
}) {
  const hang = Math.floor(chiSo / canhBan);
  const cot = chiSo % canhBan;
  const hopLe = laKyTuO(kyTu);

  // Ô cũ trượt từ chỗ cũ xuống; ô mới vào từ ngoài mép trên.
  let yDau = 0;
  if (nguon) {
    yDau =
      nguon.tuHang === null ? -(hang + 1) * 100 : (nguon.tuHang - hang) * 100;
  }
  const laMoi = nguon?.tuHang === null;

  return (
    <div role="gridcell" className="aspect-square p-[2px]">
      <motion.button
        type="button"
        disabled={tatCa || !hopLe}
        onClick={onBam}
        aria-label={
          hopLe
            ? `${tenLoai(kyTu)} — hàng ${hang + 1}, cột ${cot + 1}`
            : `Ô trống — hàng ${hang + 1}, cột ${cot + 1}`
        }
        aria-pressed={daChon}
        initial={{ y: `${yDau}%`, opacity: laMoi ? 0 : 1 }}
        animate={
          dangXoa
            ? { scale: 0.2, opacity: 0, rotate: 25 }
            : { y: 0, opacity: 1, scale: 1, rotate: 0 }
        }
        transition={{
          duration: dangXoa ? MS_TAN / 1000 : MS_ROI / 1000,
          ease: dangXoa ? "easeIn" : [0.33, 1.2, 0.68, 1],
        }}
        className={`flex size-full items-center justify-center rounded-lg border transition-colors ${
          daChon
            ? "border-gold/50 bg-gold/20"
            : "border-transparent bg-muted hover:border-gold/30"
        } ${ngam && !tatCa ? "cursor-crosshair hover:bg-gold/10" : ""} ${
          tatCa ? "cursor-default" : ""
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
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <span className="font-display text-base text-gold">
            {phien.nhanVat.tenKiNang}
          </span>
          <span className="ml-2 text-2xs text-muted-foreground">
            {phien.nhanVat.ten}
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
