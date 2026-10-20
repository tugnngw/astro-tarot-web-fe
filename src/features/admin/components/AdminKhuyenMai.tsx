import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import {
  getTatCaKhuyenMai,
  suaKhuyenMai,
  taoKhuyenMai,
  xoaKhuyenMai,
  type KhuyenMai,
  type LoaiGiam,
  type LuuKhuyenMai,
} from "@/api/khuyen-mai";
import {
  MAU_DIP_LE,
  choONhapNgay,
  khoangNgayGoiY,
  type MauDipLe,
} from "@/lib/ngay-le-vn";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

interface Form {
  id: string | null;
  ten: string;
  loiChuc: string;
  loaiGiam: LoaiGiam;
  giaTri: string;
  giamToiDa: string;
  batDau: string;
  ketThuc: string;
  dangBat: boolean;
}

function formRong(): Form {
  const bayGio = new Date();
  const sauMotTuan = new Date(bayGio.getTime() + 7 * 24 * 3600 * 1000);
  return {
    id: null,
    ten: "",
    loiChuc: "",
    loaiGiam: "PHAN_TRAM",
    giaTri: "",
    giamToiDa: "",
    batDau: choONhapNgay(bayGio),
    ketThuc: choONhapNgay(sauMotTuan),
    dangBat: true,
  };
}

function tuDot(k: KhuyenMai): Form {
  return {
    id: k.id,
    ten: k.ten,
    loiChuc: k.loiChuc ?? "",
    loaiGiam: k.loaiGiam,
    giaTri: String(k.giaTri),
    giamToiDa: k.giamToiDa != null ? String(k.giamToiDa) : "",
    batDau: choONhapNgay(new Date(k.batDau)),
    ketThuc: choONhapNgay(new Date(k.ketThuc)),
    dangBat: k.dangBat,
  };
}

/**
 * Nhập đợt khuyến mãi theo dịp lễ.
 *
 * Mức giảm được kiểm ở ba tầng — ở đây, ở tầng dịch vụ, và bằng CHECK trong
 * cơ sở dữ liệu. Không thừa: gõ nhầm 150% thì khách được TRẢ TIỀN để mua gói,
 * và tiền ấy không đòi lại được.
 */
export function AdminKhuyenMai() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["khuyen-mai", "admin"],
    queryFn: getTatCaKhuyenMai,
  });

  const lamMoi = () => {
    void queryClient.invalidateQueries({ queryKey: ["khuyen-mai"] });
  };

  const luu = useMutation({
    mutationFn: (f: Form) => {
      const payload: LuuKhuyenMai = {
        ten: f.ten.trim(),
        loiChuc: f.loiChuc.trim() || null,
        loaiGiam: f.loaiGiam,
        giaTri: Number(f.giaTri),
        giamToiDa:
          f.loaiGiam === "PHAN_TRAM" && f.giamToiDa.trim()
            ? Number(f.giamToiDa)
            : null,
        batDau: new Date(f.batDau).toISOString(),
        ketThuc: new Date(f.ketThuc).toISOString(),
        dangBat: f.dangBat,
      };
      return f.id ? suaKhuyenMai(f.id, payload) : taoKhuyenMai(payload);
    },
    onSuccess: () => {
      toast.success("Đã lưu đợt khuyến mãi");
      setForm(null);
      lamMoi();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không lưu được"),
  });

  const xoa = useMutation({
    mutationFn: xoaKhuyenMai,
    onSuccess: () => {
      toast.success("Đã xoá đợt khuyến mãi");
      lamMoi();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  const loiForm = useMemo(() => kiemForm(form), [form]);

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl border border-gold/25 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Khuyến mãi dịp lễ</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Trong khoảng ngày của đợt, giá gói AI tự giảm và mỗi người nhận
              lời chúc đúng một lần.
            </p>
          </div>
          <button
            onClick={() => setForm(formRong())}
            className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Thêm đợt
          </button>
        </div>

        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
          Gói AI mua trong app Android đi qua Google Play nên{" "}
          <strong>không giảm giá được</strong> — giá bên đó do Play Console
          quyết định. Đợt này áp cho ví (web và app) và PayOS (web).
        </p>
      </section>

      {form && (
        <FormDot
          form={form}
          loi={loiForm}
          dangLuu={luu.isPending}
          onDoi={setForm}
          onHuy={() => setForm(null)}
          onLuu={() => luu.mutate(form)}
        />
      )}

      <section className="glass rounded-2xl border border-white/10 p-5">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        )}
        {isError && (
          <p className="text-sm text-rose-400">Không đọc được danh sách.</p>
        )}
        {!isLoading && !isError && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có đợt nào. Bấm “Thêm đợt” rồi chọn một dịp lễ có sẵn.
          </p>
        )}

        <div className="space-y-3">
          {(data ?? []).map((k) => (
            <div
              key={k.id}
              className="rounded-xl border border-white/10 bg-mystic/5 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{k.ten}</span>
                    {k.dangChay ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                        Đang chạy
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {k.dangBat ? "Ngoài khoảng ngày" : "Đã tắt"}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-foreground/80">
                    {k.loaiGiam === "PHAN_TRAM"
                      ? `Giảm ${k.giaTri}%` +
                        (k.giamToiDa ? `, tối đa ${vnd(k.giamToiDa)}` : "")
                      : `Giảm ${vnd(k.giaTri)}`}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(k.batDau).toLocaleString("vi-VN")} →{" "}
                    {new Date(k.ketThuc).toLocaleString("vi-VN")}
                  </div>
                  {k.loiChuc && (
                    <p className="mt-2 max-w-prose text-xs italic text-muted-foreground/80">
                      “{k.loiChuc}”
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(tuDot(k))}
                    className="rounded-lg border border-white/15 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={`Sửa ${k.ten}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xoá đợt “${k.ten}”?`)) xoa.mutate(k.id);
                    }}
                    className="rounded-lg border border-rose-500/30 p-2 text-rose-300"
                    aria-label={`Xoá ${k.ten}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Kiểm trước khi gửi. Trả câu cần nói, hoặc `null` khi hợp lệ.
 *
 * Tách riêng để kiểm được bằng test, và để nút Lưu khoá đúng lúc.
 */
export function kiemForm(f: Form | null): string | null {
  if (!f) return null;
  if (!f.ten.trim()) return "Nhập tên đợt.";

  const giaTri = Number(f.giaTri);
  if (!Number.isFinite(giaTri) || giaTri <= 0) return "Mức giảm phải lớn hơn 0.";
  if (f.loaiGiam === "PHAN_TRAM" && (giaTri < 1 || giaTri > 100)) {
    return "Giảm theo phần trăm phải nằm trong 1–100.";
  }

  if (f.loaiGiam === "PHAN_TRAM" && f.giamToiDa.trim()) {
    const tran = Number(f.giamToiDa);
    if (!Number.isFinite(tran) || tran <= 0) return "Trần giảm phải lớn hơn 0.";
  }

  if (!f.batDau || !f.ketThuc) return "Chọn khoảng ngày.";
  if (new Date(f.ketThuc) <= new Date(f.batDau)) {
    return "Ngày kết thúc phải sau ngày bắt đầu.";
  }
  return null;
}

function FormDot({
  form,
  loi,
  dangLuu,
  onDoi,
  onHuy,
  onLuu,
}: {
  form: Form;
  loi: string | null;
  dangLuu: boolean;
  onDoi: (f: Form) => void;
  onHuy: () => void;
  onLuu: () => void;
}) {
  const nam = new Date().getFullYear();

  const dienMau = (m: MauDipLe) => {
    const khoang = khoangNgayGoiY(m, nam);
    onDoi({
      ...form,
      ten: `${m.ten} ${nam}`,
      loiChuc: m.loiChuc,
      ...(khoang
        ? {
            batDau: choONhapNgay(khoang.batDau),
            ketThuc: choONhapNgay(khoang.ketThuc),
          }
        : {}),
    });
    if (!khoang) {
      toast.info(
        `${m.ten} tính theo âm lịch nên đổi ngày mỗi năm — tra lịch rồi chọn khoảng ngày giúp.`,
      );
    }
  };

  const o =
    "w-full rounded-lg border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold";

  return (
    <section className="glass rounded-2xl border border-gold/25 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {form.id ? "Sửa đợt" : "Đợt khuyến mãi mới"}
        </h3>
        <button onClick={onHuy} aria-label="Đóng">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Điền nhanh theo dịp lễ
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MAU_DIP_LE.map((m) => (
            <button
              key={m.ten}
              onClick={() => dienMau(m)}
              className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold/90 hover:bg-gold/10"
            >
              {m.ten}
              {m.theoAmLich && " (âm lịch)"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs text-muted-foreground">
            Tên đợt
          </span>
          <input
            className={o}
            value={form.ten}
            onChange={(e) => onDoi({ ...form, ten: e.target.value })}
            placeholder="Tết Nguyên đán 2027"
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs text-muted-foreground">
            Lời chúc — để trống thì đợt này chỉ giảm giá
          </span>
          <textarea
            className={`${o} min-h-20`}
            value={form.loiChuc}
            onChange={(e) => onDoi({ ...form, loiChuc: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-muted-foreground">
            Kiểu giảm
          </span>
          <select
            className={o}
            value={form.loaiGiam}
            onChange={(e) =>
              onDoi({ ...form, loaiGiam: e.target.value as LoaiGiam })
            }
          >
            <option value="PHAN_TRAM">Theo phần trăm</option>
            <option value="SO_TIEN">Theo số tiền</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs text-muted-foreground">
            {form.loaiGiam === "PHAN_TRAM" ? "Giảm (%)" : "Giảm (đồng)"}
          </span>
          <input
            className={o}
            inputMode="numeric"
            value={form.giaTri}
            onChange={(e) => onDoi({ ...form, giaTri: e.target.value })}
          />
        </label>

        {form.loaiGiam === "PHAN_TRAM" && (
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs text-muted-foreground">
              Giảm tối đa (đồng) — nên điền
            </span>
            <input
              className={o}
              inputMode="numeric"
              value={form.giamToiDa}
              onChange={(e) => onDoi({ ...form, giamToiDa: e.target.value })}
              placeholder="50000"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground/70">
              “Giảm 50%” trên gói Pro 239.000 là 119.500 — con số không hiện ra
              lúc gõ số 50. Đặt trần thì mỗi lượt chỉ bớt tối đa chừng này.
            </span>
          </label>
        )}

        <label>
          <span className="mb-1 block text-xs text-muted-foreground">
            Bắt đầu
          </span>
          <input
            type="datetime-local"
            className={o}
            value={form.batDau}
            onChange={(e) => onDoi({ ...form, batDau: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-muted-foreground">
            Kết thúc — mốc này không tính vào
          </span>
          <input
            type="datetime-local"
            className={o}
            value={form.ketThuc}
            onChange={(e) => onDoi({ ...form, ketThuc: e.target.value })}
          />
        </label>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.dangBat}
            onChange={(e) => onDoi({ ...form, dangBat: e.target.checked })}
          />
          <span className="text-sm">
            Đang bật{" "}
            <span className="text-xs text-muted-foreground">
              — tắt để dừng gấp mà không phải sửa ngày
            </span>
          </span>
        </label>
      </div>

      {loi && <p className="mt-3 text-sm text-rose-400">{loi}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onLuu}
          disabled={Boolean(loi) || dangLuu}
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {dangLuu ? "Đang lưu…" : "Lưu đợt"}
        </button>
        <button
          onClick={onHuy}
          className="rounded-full border border-white/15 px-5 py-2 text-sm"
        >
          Huỷ
        </button>
      </div>
    </section>
  );
}
