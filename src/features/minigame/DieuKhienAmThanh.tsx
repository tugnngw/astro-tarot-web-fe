import { useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

import type { CaiDatAm } from "./am-thanh";

/**
 * Nút tắt/bật và thanh chỉnh to nhỏ.
 *
 * ## Vì sao bật sẵn
 *
 * Trang tự kêu lên là phiền, nên theo lệ thì nên tắt sẵn. Nhưng ở đây tiếng
 * chỉ kêu sau khi người chơi đã kéo một ô — không có đường nào nó kêu lúc
 * người ta vừa mở trang. Mà tắt sẵn thì gần như không ai đi bật, và họ chơi
 * cả ván thiếu mất nửa phần phản hồi: tiếng lên giọng theo từng bậc dây
 * chuyền là thứ nói cho người chơi biết chuỗi chưa dứt, mắt không làm thay
 * được việc ấy.
 *
 * Nên bật sẵn, nhưng nút tắt phải nhìn thấy ngay chứ không giấu trong một
 * trang cài đặt, và lựa chọn ấy được nhớ.
 */
export function DieuKhienAmThanh({
  caiDat,
  datBat,
  datMuc,
}: {
  caiDat: CaiDatAm;
  datBat: (b: boolean) => void;
  datMuc: (m: number) => void;
}) {
  const idMuc = useRef(`muc-am-${Math.random().toString(36).slice(2, 8)}`);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-card px-3 py-2">
      <button
        type="button"
        onClick={() => datBat(!caiDat.bat)}
        aria-pressed={caiDat.bat}
        className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
        title={caiDat.bat ? "Tắt tiếng" : "Bật tiếng"}
      >
        {caiDat.bat ? (
          <Volume2 className="size-4" />
        ) : (
          <VolumeX className="size-4" />
        )}
        <span className="sr-only">
          {caiDat.bat ? "Tắt tiếng trò chơi" : "Bật tiếng trò chơi"}
        </span>
      </button>

      <label htmlFor={idMuc.current} className="sr-only">
        Độ to tiếng trò chơi
      </label>
      <input
        id={idMuc.current}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(caiDat.muc * 100)}
        onChange={(e) => datMuc(Number(e.target.value) / 100)}
        disabled={!caiDat.bat}
        className="h-1 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-gold/20 accent-gold disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
