import { Link } from "@tanstack/react-router";
import { Sparkles, CalendarCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Ba việc làm được ở đây.
 *
 * Trang chủ cũ không chỗ nào nói rõ website này thật ra làm gì — người mới vào
 * phải tự đoán qua thanh điều hướng. Khối này trả lời thẳng câu đó, mỗi mục
 * kèm một con số cụ thể và một lối đi tiếp, thay vì ba dòng quảng cáo chung
 * chung.
 */

const PILLARS = [
  {
    icon: Sparkles,
    tag: "Miễn phí",
    title: "Trải bài Tarot cùng AI",
    desc: "Đặt câu hỏi bằng lời của bạn. AI rút bài và diễn giải dựa trên bản đồ sao ngày sinh, trả lời theo từng câu chứ không đọc nghĩa chung chung.",
    points: ["78 lá đầy đủ", "Đọc theo bản đồ sao", "Trả lời trực tiếp"],
    to: "/tarot" as const,
    cta: "Thử trải bài",
  },
  {
    icon: CalendarCheck,
    tag: "Có ký quỹ",
    title: "Đặt lịch Reader thật",
    desc: "Khi cần một người thật lắng nghe, chọn Reader theo chuyên môn và khung giờ trống. Tiền giữ ở ký quỹ tới khi buổi xem kết thúc.",
    points: ["Xem lịch trống", "Chọn theo chuyên môn", "Đánh giá công khai"],
    to: "/readers" as const,
    cta: "Xem danh sách Reader",
  },
  {
    icon: ShoppingBag,
    tag: "Giao toàn quốc",
    title: "Sắm vật phẩm",
    desc: "Bộ bài Tarot, Lenormand, Oracle, đá khoáng và phụ kiện trải bài — tuyển chọn cho cả người mới lẫn Reader chuyên nghiệp.",
    points: ["5 danh mục", "Theo dõi đơn hàng", "Đổi trả trong 7 ngày"],
    to: "/shop" as const,
    cta: "Ghé cửa hàng",
  },
];

export function WhatYouCanDo() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Reveal>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
            ✦ Ở đây có gì
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">
            Ba cách để bắt đầu
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Tự hỏi bài, nhờ người có nghề, hay sắm cho mình một bộ bài riêng —
            tuỳ bạn đang cần gì lúc này.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <article className="card-hover glass flex h-full flex-col rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/10">
                  <p.icon aria-hidden="true" className="h-5 w-5 text-gold" />
                </span>
                <span className="rounded-full border border-gold/30 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold/80">
                  {p.tag}
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.desc}
              </p>

              <ul className="mt-4 space-y-1.5">
                {p.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-xs text-foreground/75"
                  >
                    <span aria-hidden="true" className="text-gold">
                      ✦
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                to={p.to}
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-gold transition hover:gap-2.5"
              >
                {p.cta}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
