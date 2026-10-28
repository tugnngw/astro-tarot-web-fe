import { Loader2, Moon, Star, Sun } from "lucide-react";
import { useState } from "react";

import type { MaNhanVat, NhanVat } from "@/api/game";
import { so } from "@/lib/tien";

/**
 * Biểu tượng của từng nhân vật.
 *
 * Tra theo mã enum chứ không theo tên hiển thị: tên là chữ người đọc, đổi
 * "Luna" thành "Hằng" là việc của nội dung, và nó không được làm mất biểu
 * tượng. Thiếu mã thì trả về Sao, chứ không để trống một ô trong lưới.
 */
const BIEU_TUONG: Record<MaNhanVat, typeof Star> = {
  LUNA: Moon,
  SOL: Sun,
  ASTRA: Star,
};

export function ChonNhanVat({
  cacNhanVat,
  dangGui,
  onChon,
}: {
  cacNhanVat: NhanVat[];
  dangGui: boolean;
  onChon: (ma: MaNhanVat) => void;
}) {
  const [dangChon, setDangChon] = useState<MaNhanVat | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl text-gold">Chọn người đồng hành</h2>
      <p className="text-xs text-muted-foreground">
        Kĩ năng nạp bằng số ô bạn xoá được. Nạp đủ thì bấm, rồi chỉ một ô để kĩ
        năng nhắm vào — nó không tốn lượt đổi chỗ nào.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {cacNhanVat.map((nv) => {
          const Icon = BIEU_TUONG[nv.ma] ?? Star;
          const nay = dangChon === nv.ma;
          return (
            <button
              key={nv.ma}
              type="button"
              disabled={dangGui}
              onClick={() => {
                setDangChon(nv.ma);
                onChon(nv.ma);
              }}
              className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors ${
                nay
                  ? "border-gold/50 bg-gold/20"
                  : "border-gold/20 bg-card hover:bg-gold/10"
              } ${dangGui && !nay ? "opacity-60" : ""}`}
            >
              <span className="flex items-center gap-2">
                <Icon
                  className="size-4 shrink-0 text-gold"
                  aria-hidden="true"
                />
                <span className="font-display text-base text-foreground">
                  {nv.ten}
                </span>
                {nay && dangGui && (
                  <Loader2 className="ml-auto size-3.5 animate-spin text-gold" />
                )}
              </span>
              <span className="text-xs font-medium text-gold-soft">
                {nv.tenKiNang}
              </span>
              <span className="text-2xs text-muted-foreground">
                {nv.moTaKiNang}
              </span>
              <span className="mt-auto pt-1 text-3xs uppercase tracking-wider text-muted-foreground">
                nạp {so(nv.nangLuongCan)} ô
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
