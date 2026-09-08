import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ZodiacAI } from "@/components/ZodiacAI";
import { TopReaders } from "@/components/TopReaders";
import { BlogToday } from "@/components/BlogToday";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Reveal } from "@/components/Reveal";
import { ContactSection } from "@/components/ContactSection";
import { useAuth } from "@/lib/auth-context";
import { TarotWheel } from "@/components/TarotWheel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTROTAROT — Tử vi · Tarot AI · Cộng đồng Reader" },
      {
        name: "description",
        content:
          "Khám phá vận mệnh qua chiêm tinh, Tarot AI và cộng đồng Reader chuyên nghiệp.",
      },
      {
        property: "og:title",
        content: "ASTROTAROT — Tử vi · Tarot · Cộng đồng",
      },
      {
        property: "og:description",
        content:
          "Tarot AI cá nhân hoá theo cung hoàng đạo. Kết nối với Reader hàng đầu.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { openAuth, requestAuth } = useAuth();

  return (
    <div className="relative">
      {/* Nền là bầu trời sao thật ở StarrySky (mount một lần tại root).
          Ảnh chòm sao tĩnh và lớp vignette trước đây đã bỏ: chúng làm nền
          đục, và giờ đã có sao thật nhấp nháy nên chồng thêm chỉ gây rối. */}

      <Header />

      <main className="snap-container">
        {/* ─── Section 1: Hero with zodiac wheel ─── */}
        <section className="snap-section relative flex items-center justify-center overflow-hidden px-6">

          {/* Vòng lá bài Tarot xoay chậm.
              Trước đây là ảnh PNG bánh xe hoàng đạo — nền của nó là xanh đen
              chứ không trong suốt nên trên nền đen lộ nguyên khung chữ nhật,
              phải chắp vá bằng mask. Vẽ bằng DOM thì nền trong suốt thật,
              theo đúng tông vàng, và nét căng ở mọi độ phân giải. */}
          {/* Kích thước tính theo CHIỀU CAO khung nhìn, không theo vmin.
              Trước đây để 118vmin: trên màn hình ngang thì vmin lấy theo
              chiều cao rồi nhân 1.18 nên vòng cao hơn cả hero, và section có
              overflow-hidden nên cung dưới bị cắt cụt giữa chừng. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <TarotWheel className="h-[min(86vh,760px)] w-[min(86vh,760px)]" />
            {/* Làm tối phần LỖ GIỮA vòng bài để chữ tiêu đề đọc được.
                Lưu ý bán kính của radial-gradient tính theo nửa chiều rộng
                hộp: "ellipse 48%" nghĩa là trải 96% bề ngang, tức phủ đen
                luôn các lá bài hai bên. Lỗ giữa vòng chỉ khoảng 55% bề ngang
                nên bán kính phải nhỏ hơn nhiều, và phải tắt hẳn trước khi
                chạm tới vành bài. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 27% 25% at center, oklch(0.02 0.004 280 / 0.95) 0%, oklch(0.02 0.004 280 / 0.8) 62%, transparent 100%)",
              }}
            />
          </div>

          {/* pointer-events-none cho cả khối chữ, chỉ bật lại ở nút bấm.
              Hộp bao của tiêu đề rộng hơn lỗ giữa vòng bài nên nó trùm lên
              các lá hai bên và ăn mất chuột — rê vào lá không có phản hồi
              gì. Chữ thì không cần nhận chuột, nên trả chuột lại cho vòng
              bài phía dưới. */}
          <div className="hero-enter pointer-events-none relative z-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-gold backdrop-blur">
              ✦ ASTROTAROT ✦
            </div>
            {/* Bóng đổ nhiều lớp bám sát nét chữ. Lớp phủ tối giờ chỉ còn
                trong lỗ giữa vòng, nên hai đầu dòng tiêu đề nằm đè lên lá
                bài — phải dựa vào bóng chữ chứ không dựa vào nền tối nữa. */}
            {/* Dùng filter: drop-shadow chứ KHÔNG dùng text-shadow.
                Dòng "Tử vi · Tarot" tô bằng background-clip:text với
                color:transparent; thứ tự vẽ của trình duyệt là nền (phần
                gradient đã cắt theo chữ) -> text-shadow -> glyph. Chữ trong
                suốt nên text-shadow rơi thẳng lên mặt gradient và làm xỉn
                chữ vàng. drop-shadow tác động lên kết quả đã dựng nên đổ
                bóng ra phía sau đúng như mong đợi. */}
            <h1
              className="mt-6 font-display text-5xl leading-tight md:text-7xl lg:text-8xl"
              style={{
                filter:
                  "drop-shadow(0 0 9px rgba(3,2,8,0.95)) drop-shadow(0 0 26px rgba(3,2,8,0.9)) drop-shadow(0 2px 44px rgba(3,2,8,0.8))",
              }}
            >
              <span className="text-gradient-gold">Tử vi · Tarot</span>
              <br />
              <span className="text-foreground">Cộng đồng Reader</span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-base text-foreground/85 md:text-lg"
              style={{
                textShadow:
                  "0 0 8px oklch(0.02 0 280 / 0.95), 0 0 20px oklch(0.02 0 280 / 0.85)",
              }}
            >
              Vũ trụ huyền bí mở ra trước bạn — nơi 12 cung hoàng đạo, lá bài
              Tarot và những Reader chuyên nghiệp cùng hội tụ.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => requestAuth(() => {})}
                className="pointer-events-auto rounded-full bg-gold px-7 py-3 font-medium text-primary-foreground glow-gold transition hover:scale-105"
              >
                ✦ Bắt đầu ngay
              </button>
              <Link
                to="/tarot"
                className="pointer-events-auto rounded-full border border-gold/60 px-7 py-3 font-medium text-gold transition hover:bg-gold/10"
              >
                Khám phá
              </Link>
            </div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-12 inline-flex flex-col items-center text-xs uppercase tracking-[0.3em] text-gold/70"
            >
              <span>Cuộn xuống</span>
              <span className="mt-1 text-2xl">↓</span>
            </motion.div>
          </div>
        </section>

        {/* ─── Section 2: Khám phá + Top Reader (vertical) ─── */}
        <section className="snap-section relative flex items-center px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
                  ✦ Vận mệnh
                </div>
                <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  Khám phá <span className="text-gradient-gold">vận mệnh</span>
                  <br />
                  qua Tarot &amp; Chiêm tinh hiện đại
                </h2>
                <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
                  Trải bài Tarot cá nhân hoá bởi AI dựa trên bản đồ sao của bạn,
                  hoặc kết nối trực tiếp với Reader chuyên nghiệp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/tarot"
                    className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105"
                  >
                    Xem Tarot Miễn phí
                  </Link>
                  <button
                    onClick={() => openAuth("reader")}
                    className="rounded-full border border-gold/60 px-6 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10"
                  >
                    Đăng ký Chuyên gia
                  </button>
                </div>
                <div className="mt-6">
                  <ZodiacAI />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h3 className="mb-4 font-display text-2xl text-gradient-gold">
                  Top Reader nổi bật
                </h3>
                <TopReaders vertical />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ─── Section 3: Shop ─── */}
        <section id="shop" className="snap-section relative flex items-center px-6">
          <Reveal className="w-full">
            <FeaturedProducts />
          </Reveal>
        </section>

        {/* ─── Section 4: Blog ─── */}
        <section className="snap-section relative flex items-center px-6">
          <Reveal className="w-full">
            <BlogToday />
          </Reveal>
        </section>

        {/* ─── Section 5: Contact ─── */}
        <section className="snap-section relative flex flex-col justify-center px-6">
          <Reveal>
            <ContactSection />
          </Reveal>
          <footer className="mt-12 text-center text-xs text-muted-foreground">
            © 2026 ASTROTAROT — Khám phá năng lượng vũ trụ
          </footer>
        </section>
      </main>
    </div>
  );
}
