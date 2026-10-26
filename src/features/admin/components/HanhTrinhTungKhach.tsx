import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Footprints, Search, User, X } from "lucide-react";
import { getHanhTrinhKhach, type HanhTrinhKhach } from "@/api/marketing";
import { ChuThich } from "@/components/ChuThich";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { so } from "@/lib/tien";
import {
  BO_LOC_RONG,
  DANG_CHU_Y,
  TEN_HANH_DONG,
  cacHanhDong,
  cacNguon,
  coLocDangBat,
  gomBuocLienTiep,
  khacNgay,
  khoangThoiGian,
  locHanhTrinh,
  nhanNhom,
  tenTrang,
  type BoLoc,
  type NhomBuoc,
} from "../hanh-trinh";

/** Bao nhiêu nhóm bước hiện ra khi thẻ còn đóng. */
const SO_NHOM_KHI_DONG = 5;

/** Giá trị cho mục "tất cả" của ô chọn — Radix Select không nhận chuỗi rỗng. */
const TAT_CA = "__tat_ca__";

function gio(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ngay(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Hành trình của từng người dùng: vào từ đâu, rồi làm những gì.
 *
 * ## Vì sao cần, dù đã có bảng gộp theo nguồn
 *
 * Bảng kia nói "Facebook mang về 21 lượt" — một con số không kể được chuyện
 * gì đã xảy ra. Cái này nói "khách `ab12cd` vào từ Facebook lúc 20:14, xem
 * trang chủ, mở Tarot, rút một quẻ, rồi đi". Nhìn mươi hành trình như vậy là
 * thấy ngay chỗ người ta bỏ cuộc.
 *
 * ## Vì sao thẻ đóng sẵn, và vì sao gộp bước lặp
 *
 * Bản đầu in thẳng mọi bước ra. Một phiên quản trị thật có 48 bước, trong đó
 * hơn 40 là `Xem /admin` lặp lại — thẻ tràn năm dòng, đẩy những phiên khác
 * xuống dưới màn hình, và chôn mất đúng những bước hiếm đáng đọc. Giờ mặc
 * định chỉ hiện {@link SO_NHOM_KHI_DONG} nhóm đầu; muốn xem hết thì mở ra,
 * và lúc mở là dòng thời gian dọc có giờ giấc chứ không phải một hàng thẻ
 * cuộn ngang.
 *
 * ## Mã khách không phải danh tính
 *
 * Nó là chuỗi ngẫu nhiên sinh trong trình duyệt — không tên, không email.
 * Xoá dữ liệu trình duyệt là thành khách mới. Tên chỉ hiện khi người ta tự
 * đăng nhập giữa chừng, và lúc ấy là tài khoản thật của chính họ.
 */
export function HanhTrinhTungKhach() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketing", "hanh-trinh"],
    queryFn: () => getHanhTrinhKhach(20),
    refetchInterval: 60_000,
  });

  const [loc, setLoc] = useState<BoLoc>(BO_LOC_RONG);

  const ds = useMemo(() => data ?? [], [data]);
  const nguon = useMemo(() => cacNguon(ds), [ds]);
  const hanhDong = useMemo(() => cacHanhDong(ds), [ds]);
  const hien = useMemo(() => locHanhTrinh(ds, loc), [ds, loc]);

  const dangLoc = coLocDangBat(loc);

  return (
    <section className="glass rounded-2xl border border-white/10 p-5">
      <div className="flex items-center gap-1.5">
        <Footprints className="h-4 w-4 shrink-0 text-gold" />
        <h3 className="font-medium">Hành trình người dùng</h3>
        <span className="text-2xs text-muted-foreground/60">
          20 khách gần nhất
        </span>
        <ChuThich>
          Mỗi thẻ là MỘT KHÁCH, gom toàn bộ hoạt động của họ trong 30 ngày —
          không phải một phiên. Nên khoảng thời gian có thể kéo nhiều ngày
          nếu người ấy quay lại. Mã khách là chuỗi ngẫu nhiên sinh trong
          trình duyệt — không phải tên, email hay số điện
          thoại; xoá dữ liệu trình duyệt là thành khách mới. Tên chỉ hiện khi
          người đó tự đăng nhập giữa chừng. Những bước giống hệt nhau nằm liền
          nhau được gộp lại và đếm bằng dấu ×.
        </ChuThich>
      </div>

      {!isLoading && !isError && ds.length > 0 && (
        <ThanhLoc
          loc={loc}
          datLoc={setLoc}
          nguon={nguon}
          hanhDong={hanhDong}
          soHien={hien.length}
          soTong={ds.length}
          dangLoc={dangLoc}
        />
      )}

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Đang tải…</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-destructive-soft">
          Không đọc được hành trình.
        </p>
      )}
      {!isLoading && !isError && ds.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Chưa có khách nào được ghi nhận. Mỗi lượt mở trang kể từ bây giờ sẽ
          hiện ở đây.
        </p>
      )}
      {!isLoading && !isError && ds.length > 0 && hien.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Không khách nào khớp bộ lọc.
        </p>
      )}

      <div className="mt-3 space-y-2.5">
        {hien.map((k) => (
          <TheKhach key={k.maKhach + k.batDau} khach={k} />
        ))}
      </div>
    </section>
  );
}

function ThanhLoc({
  loc,
  datLoc,
  nguon,
  hanhDong,
  soHien,
  soTong,
  dangLoc,
}: {
  loc: BoLoc;
  datLoc: (v: BoLoc) => void;
  nguon: string[];
  hanhDong: string[];
  soHien: number;
  soTong: number;
  dangLoc: boolean;
}) {
  const lopChon =
    "h-9 w-auto min-w-[9rem] rounded-full border-gold/20 bg-input/70 px-3.5 text-xs text-foreground focus:ring-1 focus:ring-gold/30";
  const lopHop =
    "rounded-xl border border-gold/20 bg-card text-foreground shadow-xl";

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          value={loc.tim}
          onChange={(e) => datLoc({ ...loc, tim: e.target.value })}
          placeholder="Tìm mã khách, tên, trang…"
          aria-label="Tìm trong hành trình"
          className="h-9 w-56 rounded-full border-gold/20 bg-input/70 pl-8 text-xs"
        />
      </div>

      <Select
        value={loc.nguon || TAT_CA}
        onValueChange={(v) => datLoc({ ...loc, nguon: v === TAT_CA ? "" : v })}
      >
        <SelectTrigger aria-label="Lọc theo nguồn" className={lopChon}>
          <SelectValue placeholder="Mọi nguồn" />
        </SelectTrigger>
        <SelectContent className={lopHop}>
          <SelectItem value={TAT_CA} className="text-xs">
            Mọi nguồn
          </SelectItem>
          {nguon.map((n) => (
            <SelectItem key={n} value={n} className="text-xs">
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={loc.hanhDong || TAT_CA}
        onValueChange={(v) =>
          datLoc({ ...loc, hanhDong: v === TAT_CA ? "" : v })
        }
      >
        <SelectTrigger aria-label="Lọc theo hành động" className={lopChon}>
          <SelectValue placeholder="Mọi hành động" />
        </SelectTrigger>
        <SelectContent className={lopHop}>
          <SelectItem value={TAT_CA} className="text-xs">
            Mọi hành động
          </SelectItem>
          <SelectItem value="__chu_y__" className="text-xs">
            Có hành động đáng chú ý
          </SelectItem>
          {hanhDong.map((h) => (
            <SelectItem key={h} value={h} className="text-xs">
              {TEN_HANH_DONG[h] ?? h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/20 bg-input/70 px-3.5 py-2 text-xs text-muted-foreground transition hover:border-gold/30">
        <input
          type="checkbox"
          checked={loc.chiDangNhap}
          onChange={(e) => datLoc({ ...loc, chiDangNhap: e.target.checked })}
          className="h-3 w-3 accent-gold"
        />
        Đã đăng nhập
      </label>

      <span className="text-2xs text-muted-foreground/60">
        {dangLoc ? `${so(soHien)}/${so(soTong)} khách` : `${so(soTong)} khách`}
      </span>

      {dangLoc && (
        <button
          type="button"
          onClick={() => datLoc(BO_LOC_RONG)}
          className="flex items-center gap-1 text-2xs text-gold transition hover:underline"
        >
          <X className="h-3 w-3" />
          Xoá lọc
        </button>
      )}
    </div>
  );
}

function TheKhach({ khach: k }: { khach: HanhTrinhKhach }) {
  const [mo, datMo] = useState(false);
  const nhom = useMemo(() => gomBuocLienTiep(k.cacBuoc), [k.cacBuoc]);

  const laKhongRo = k.nguon.startsWith("(");
  const conLai = nhom.length - SO_NHOM_KHI_DONG;

  return (
    <div className="rounded-xl bg-mystic/10 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-2xs text-muted-foreground">
          {k.maKhach}
        </span>

        <span
          className={
            laKhongRo
              ? "rounded-full border border-white/10 px-2 py-0.5 text-2xs text-muted-foreground"
              : "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-2xs text-success"
          }
        >
          {k.nguon}
          {k.kenh ? ` · ${k.kenh}` : ""}
          {k.chienDich ? ` · ${k.chienDich}` : ""}
        </span>

        {k.tenNguoiDung && (
          <span className="flex items-center gap-1 text-2xs text-gold">
            <User className="h-3 w-3" />
            {k.tenNguoiDung}
          </span>
        )}

        <span
          className="ml-auto text-2xs text-muted-foreground"
          title={`${ngay(k.batDau)} ${gio(k.batDau)} → ${ngay(k.ketThuc)} ${gio(k.ketThuc)}`}
        >
          {ngay(k.batDau)} {gio(k.batDau)}
          {khacNgay(k.batDau, k.ketThuc)
            ? ` → ${ngay(k.ketThuc)} ${gio(k.ketThuc)}`
            : `–${gio(k.ketThuc)}`}{" "}
          · {khoangThoiGian(k.batDau, k.ketThuc)} · {so(k.soHanhDong)} bước
        </span>
      </div>

      {mo ? (
        <DongThoiGian nhom={nhom} />
      ) : (
        <ChuoiRutGon nhom={nhom.slice(0, SO_NHOM_KHI_DONG)} />
      )}

      {nhom.length > SO_NHOM_KHI_DONG && (
        <button
          type="button"
          onClick={() => datMo(!mo)}
          aria-expanded={mo}
          className="mt-2 flex items-center gap-1 text-2xs text-gold transition hover:underline"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${mo ? "rotate-180" : ""}`}
          />
          {mo ? "Thu gọn" : `Xem cả ${so(nhom.length)} bước (+${so(conLai)})`}
        </button>
      )}
    </div>
  );
}

/** Hàng thẻ nằm ngang — đủ để liếc qua là biết phiên này đại khái làm gì. */
function ChuoiRutGon({ nhom }: { nhom: NhomBuoc[] }) {
  return (
    <ol className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1.5">
      {nhom.map((n, i) => (
        <li key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/40">›</span>}
          <span
            title={`${n.duongDan ?? ""} · ${gio(n.dau)}`}
            className={
              DANG_CHU_Y.has(n.hanhDong)
                ? "rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-2xs text-gold"
                : "rounded border border-white/10 px-1.5 py-0.5 text-2xs text-muted-foreground"
            }
          >
            {nhanNhom(n)}
            {n.soLan > 1 && (
              <span className="text-muted-foreground/60"> ×{n.soLan}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Dòng thời gian dọc khi mở thẻ.
 *
 * Dọc chứ không ngang vì khi đã mở ra để đọc kỹ thì thứ cần là giờ giấc và
 * chi tiết của từng bước — những thứ không nhét vừa một thẻ nằm ngang.
 */
function DongThoiGian({ nhom }: { nhom: NhomBuoc[] }) {
  return (
    <ol className="mt-3 space-y-0">
      {nhom.map((n, i) => {
        const chuY = DANG_CHU_Y.has(n.hanhDong);
        return (
          <li key={i} className="flex gap-2.5">
            {/* Cột mốc: chấm tròn nối bằng một đường dọc. */}
            <div className="flex flex-col items-center">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  chuY ? "bg-gold" : "bg-muted-foreground/40"
                }`}
              />
              {i < nhom.length - 1 && (
                <span className="w-px flex-1 bg-white/10" />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={`text-xs ${chuY ? "text-gold" : "text-foreground/90"}`}
                >
                  {nhanNhom(n)}
                  {n.soLan > 1 && (
                    <span className="text-muted-foreground/60">
                      {" "}
                      ×{n.soLan}
                    </span>
                  )}
                </span>
                <span className="text-3xs text-muted-foreground/60">
                  {gio(n.dau)}
                  {n.soLan > 1 && n.cuoi !== n.dau ? `–${gio(n.cuoi)}` : ""}
                </span>
              </div>

              {n.chiTiet && (
                <p className="mt-0.5 text-3xs text-muted-foreground">
                  {n.chiTiet}
                </p>
              )}
              {n.hanhDong === "xem_trang" &&
                n.duongDan &&
                tenTrang(n.duongDan) !== n.duongDan && (
                  <p className="mt-0.5 truncate font-mono text-3xs text-muted-foreground/50">
                    {n.duongDan}
                  </p>
                )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
