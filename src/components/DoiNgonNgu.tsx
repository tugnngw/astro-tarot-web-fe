// Nút đổi tiếng Việt ↔ tiếng Anh.
//
// Hai chữ VI / EN cạnh nhau chứ không phải ô chọn thả xuống: chỉ có hai lựa
// chọn, mà một ô thả xuống bắt người ta bấm hai lần để đổi một thứ nhìn phát
// biết ngay. Cũng không dùng cờ quốc gia — tiếng Anh không thuộc về một nước
// nào, và cờ thì người dùng Việt hay hiểu nhầm là đổi quốc gia giao hàng.

import { useNgu, type NgonNgu } from "@/lib/ngon-ngu";

const MUC: { ma: NgonNgu; nhan: string; moTa: string }[] = [
  { ma: "vi", nhan: "VI", moTa: "Tiếng Việt" },
  { ma: "en", nhan: "EN", moTa: "English" },
];

export function DoiNgonNgu({ className = "" }: { className?: string }) {
  const { ngonNgu, doiNgonNgu } = useNgu();
  return (
    <div
      role="group"
      aria-label="Ngôn ngữ / Language"
      className={`inline-flex overflow-hidden rounded-full border border-mystic/50 ${className}`}
    >
      {MUC.map((m) => {
        const dangChon = m.ma === ngonNgu;
        return (
          <button
            key={m.ma}
            type="button"
            lang={m.ma}
            title={m.moTa}
            aria-pressed={dangChon}
            onClick={() => doiNgonNgu(m.ma)}
            className={`px-2.5 py-1 text-2xs font-semibold tracking-wide transition ${
              dangChon
                ? "bg-gold/20 text-gold"
                : "text-muted-foreground hover:bg-gold/10 hover:text-gold"
            }`}
          >
            {m.nhan}
          </button>
        );
      })}
    </div>
  );
}
