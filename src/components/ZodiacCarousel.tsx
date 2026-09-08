import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  badge: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    badge: "Top Reader tháng",
    title: "Huyền Linh",
    subtitle: "Cung Song Ngư ♓",
    meta: "142 bài đọc",
    icon: "🌙",
    accent: "from-fuchsia-500/30 to-violet-500/10",
  },
  {
    badge: "Top Reader tháng",
    title: "Minh Nguyệt",
    subtitle: "Cung Bọ Cạp ♏",
    meta: "128 bài đọc",
    icon: "✨",
    accent: "from-cyan-400/30 to-blue-500/10",
  },
  {
    badge: "Top Reader tháng",
    title: "Bảo An",
    subtitle: "Cung Xử Nữ ♍",
    meta: "115 bài đọc",
    icon: "🔮",
    accent: "from-amber-400/30 to-yellow-500/10",
  },
  {
    badge: "Gợi ý từ AI",
    title: "Dành cho Bạch Dương",
    subtitle: "Năng lượng Sao Hoả đang dâng cao",
    meta: "Khám phá ngay",
    icon: "♈",
    accent: "from-rose-500/30 to-orange-500/10",
  },
  {
    badge: "Tarot nổi bật",
    title: "The Star ★",
    subtitle: "Hy vọng · Chữa lành · Cảm hứng",
    meta: "Lá bài của tuần",
    icon: "⭐",
    accent: "from-teal-400/30 to-emerald-500/10",
  },
];

export function ZodiacCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const prev = () => setI((p) => (p - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setI((p) => (p + 1) % SLIDES.length);
  const s = SLIDES[i];

  return (
    <div className="relative mx-auto max-w-4xl">
      <div
        className={`relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br ${s.accent} backdrop-blur-xl p-10 shadow-[0_0_60px_-10px_rgba(212,175,55,0.4)] transition-all duration-700`}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative flex items-center gap-8">
          <div className="text-7xl drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">
            {s.icon}
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">
              {s.badge}
            </div>
            <h3 className="mt-2 font-display text-4xl text-gradient-gold">
              {s.title}
            </h3>
            <p className="mt-2 text-muted-foreground">{s.subtitle}</p>
            <p className="mt-3 text-sm font-medium text-gold-soft">{s.meta}</p>
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute -left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-card/80 text-gold backdrop-blur transition hover:bg-gold hover:text-primary-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next"
        className="absolute -right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-card/80 text-gold backdrop-blur transition hover:bg-gold hover:text-primary-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-2 bg-gold/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
