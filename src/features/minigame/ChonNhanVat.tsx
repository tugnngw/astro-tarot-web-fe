import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { MaNhanVat, NhanVat } from "@/api/game";
import { so } from "@/lib/tien";
import { AnhNhanVat } from "./AnhNhanVat";

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

      <div className="grid gap-3 sm:grid-cols-3">
        {cacNhanVat.map((nv) => {
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
              className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                nay
                  ? "border-gold/50 bg-gold/20"
                  : "border-gold/20 bg-card hover:bg-gold/10"
              } ${dangGui && !nay ? "opacity-60" : ""}`}
            >
              {/* Huy hiệu phóng to một chút khi rê chuột. Đây là thứ duy nhất
                  trên thẻ nói được "bấm vào đi" mà không thêm chữ nào. */}
              <AnhNhanVat
                ma={nv.ma}
                className="size-16 shrink-0 transition-transform duration-200 group-hover:scale-110"
              />

              <span className="font-display text-lg text-foreground">
                {nv.ten}
              </span>
              <span className="text-sm font-medium text-gold">
                {nv.tenKiNang}
              </span>
              <span className="text-2xs leading-snug text-muted-foreground">
                {nv.moTaKiNang}
              </span>

              <span className="mt-auto flex items-center gap-1.5 pt-2 text-3xs uppercase tracking-wider text-muted-foreground">
                {nay && dangGui ? (
                  <Loader2 className="size-3 animate-spin text-gold" />
                ) : null}
                nạp {so(nv.nangLuongCan)} ô
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
