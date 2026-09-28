import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NHOM_EMOTE } from "../emote";

/** Lưới biểu cảm hiện phía trên ô nhập, chỉ khi bấm nút mặt. */
export function BangEmote({ onChon }: { onChon: (ky: string) => void }) {
  const [tim, setTim] = useState("");
  const tu = tim.trim().toLowerCase();
  const nhom = useMemo(
    () =>
      NHOM_EMOTE.map((n) => ({
        ...n,
        muc: n.muc.filter(
          (e) => !tu || e.ten.includes(tu) || e.ky.includes(tu),
        ),
      })).filter((n) => n.muc.length > 0),
    [tu],
  );

  return (
    <div className="absolute bottom-full right-0 z-20 mb-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-gold/50 bg-[#1c1c1e] text-white shadow-2xl">
      <label className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-sm text-white/70">
        <Search aria-hidden className="h-4 w-4 shrink-0" />
        <input
          value={tim}
          onChange={(e) => setTim(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Tìm biểu cảm"
          className="w-full bg-transparent outline-none placeholder:text-white/40"
        />
      </label>
      <div className="max-h-64 overflow-y-auto px-2 py-2">
        {nhom.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-white/50">
            Không thấy biểu cảm nào
          </p>
        ) : (
          nhom.map((n) => (
            <section key={n.ten} className="mb-2">
              <p className="px-1 py-1 text-[11px] text-white/45">{n.ten}</p>
              <div className="grid grid-cols-8 gap-0.5">
                {n.muc.map((e) => (
                  <button
                    key={`${n.ten}-${e.ky}`}
                    type="button"
                    onClick={() => onChon(e.ky)}
                    title={e.ten}
                    className="grid h-8 w-8 place-items-center rounded-lg text-xl hover:bg-white/10"
                  >
                    {e.ky}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
