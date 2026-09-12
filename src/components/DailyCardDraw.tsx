import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RelatedProducts } from "@/features/shop/components/RelatedProducts";
import { Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { MAJOR_ARCANA, getDailyCard, type TarotCard } from "@/lib/tarot-cards";
import { OrnateFrame } from "@/components/OrnateFrame";

/**
 * Rút một lá ngay trên trang chủ.
 *
 * Đây là thứ thay cho card "AI Zodiac Oracle" cũ — vốn chỉ có một ô chọn cung
 * hoàng đạo và đoạn mô tả không đổi, tức là nhìn thì có vẻ tương tác mà thực
 * ra chẳng làm được gì.
 *
 * Người mới vào trang tarot muốn THỬ ngay chứ không muốn đọc giới thiệu. Cho
 * họ lật một lá thật, đọc một câu gợi mở, rồi mới mời sang trải bài đầy đủ.
 */

/** Ba lá úp cho người dùng chọn. */
const SLOTS = [0, 1, 2];

export function DailyCardDraw() {
  // Lá mặc định chọn theo NGÀY nên server và client dựng ra giống nhau; dùng
  // Math.random() ở đây sẽ gây hydration mismatch.
  const [picked, setPicked] = useState<TarotCard | null>(null);
  const [pickedSlot, setPickedSlot] = useState<number | null>(null);

  function draw(slot: number) {
    // Chỉ tới lúc người dùng BẤM mới random — lúc này đã ở phía client nên
    // không ảnh hưởng hydration.
    const card = MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
    setPicked(card);
    setPickedSlot(slot);
  }

  function reset() {
    setPicked(null);
    setPickedSlot(null);
  }

  return (
    <OrnateFrame className="overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-gold/80">
            ✦ Rút thử một lá
          </span>
          <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold">
            Miễn phí
          </span>
        </div>

        {picked ? (
          <Revealed card={picked} onReset={reset} />
        ) : (
          <Facedown onPick={draw} pickedSlot={pickedSlot} />
        )}
      </div>
    </OrnateFrame>
  );
}

function Facedown({
  onPick,
  pickedSlot,
}: {
  onPick: (slot: number) => void;
  pickedSlot: number | null;
}) {
  const today = getDailyCard();

  return (
    <>
      <h3 className="mt-3 font-display text-2xl leading-snug sm:text-3xl">
        Hôm nay vũ trụ muốn nói gì với bạn?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Hít một hơi, nghĩ về điều đang khiến bạn băn khoăn, rồi chọn một lá.
      </p>

      <div className="mt-6 flex justify-center gap-4 sm:gap-6">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onPick(slot)}
            aria-label={`Chọn lá bài thứ ${slot + 1}`}
            className={`group relative aspect-[2/3] w-[86px] shrink-0 overflow-hidden rounded-xl border border-gold/50 bg-[oklch(0.08_0.02_282)] transition-transform duration-300 hover:-translate-y-2 hover:border-gold sm:w-[104px] ${
              pickedSlot === slot ? "-translate-y-2" : ""
            }`}
          >
            <CardBackArt />
            <span className="absolute inset-x-0 bottom-2 text-center text-[10px] uppercase tracking-[0.2em] text-gold/0 transition group-hover:text-gold/80">
              Chọn
            </span>
          </button>
        ))}
      </div>

      {/* Lá của ngày: cho người dùng một lý do quay lại vào hôm sau. */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Lá của hôm nay là <span className="text-gold">{today.nameVi}</span> —
        rút để xem lá của riêng bạn.
      </p>
    </>
  );
}

/** Lưng bài vẽ bằng SVG, cùng ngôn ngữ hình với vòng bài ở hero. */
function CardBackArt() {
  return (
    <svg
      viewBox="0 0 60 90"
      aria-hidden="true"
      className="h-full w-full"
      fill="none"
      stroke="rgba(226,183,92,0.7)"
      strokeWidth="0.9"
      strokeLinecap="round"
    >
      <rect x="4" y="4" width="52" height="82" rx="4" opacity="0.5" />
      <g transform="translate(30 45)">
        <circle r="9" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 13}
              y1={Math.sin(a) * 13}
              x2={Math.cos(a) * 17}
              y2={Math.sin(a) * 17}
              opacity="0.7"
            />
          );
        })}
        <path
          d="M0 -5 L1.6 -1.6 L5 0 L1.6 1.6 L0 5 L-1.6 1.6 L-5 0 L-1.6 -1.6 Z"
          fill="rgba(226,183,92,0.85)"
          stroke="none"
        />
      </g>
    </svg>
  );
}

function Revealed({ card, onReset }: { card: TarotCard; onReset: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
      <img
        src={`/tarot/${card.file}.jpg`}
        alt={`Lá ${card.nameVi}`}
        className="mx-auto w-[128px] shrink-0 rounded-lg border border-gold/50 shadow-[0_0_30px_-8px_rgba(226,183,92,0.6)] sm:mx-0"
      />

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl text-gradient-gold sm:text-3xl">
          {card.nameVi}
        </h3>
        <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {card.name}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {card.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] text-gold"
            >
              {k}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/85">
          {card.meaning}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/tarot"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Trải bài đầy đủ với AI
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Rút lá khác
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Đây mới là một lá gợi mở. Trải bài đầy đủ đọc theo câu hỏi và bản đồ
          sao của riêng bạn.{" "}
          <Link to="/readers" className="text-gold hover:underline">
            Hoặc nói chuyện với Reader thật
            <ArrowRight aria-hidden="true" className="ml-0.5 inline h-3 w-3" />
          </Link>
        </p>

        {/* Liên hệ có thật, không phải ghép cho có: ảnh lá bài ở trên lấy từ
            chính bản in Rider-Waite-Smith 1909 — cùng bộ bài đang bán. */}
        <RelatedProducts
          categorySlug="bai-tarot"
          title="Muốn tự rút bài ở nhà?"
          hint="Ảnh lá bài phía trên lấy từ bộ Rider-Waite-Smith. Đây là những bộ bài cùng dòng."
        />
      </div>
    </div>
  );
}
