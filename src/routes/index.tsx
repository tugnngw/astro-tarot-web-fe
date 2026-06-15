import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { ZodiacAI } from "@/components/ZodiacAI";
import { TopReaders } from "@/components/TopReaders";
import { BlogToday } from "@/components/BlogToday";
import { ContactSection } from "@/components/ContactSection";
import { useAuth } from "@/lib/auth-context";
import bgConstellations from "@/assets/constellations-bg.png";
import zodiacWheel from "@/assets/zodiac-wheel.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTROTAROT — Tử vi · Tarot AI · Cộng đồng Reader" },
      { name: "description", content: "Khám phá vận mệnh qua chiêm tinh, Tarot AI và cộng đồng Reader chuyên nghiệp." },
      { property: "og:title", content: "ASTROTAROT — Tử vi · Tarot · Cộng đồng" },
      { property: "og:description", content: "Tarot AI cá nhân hoá theo cung hoàng đạo. Kết nối với Reader hàng đầu." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { openAuth, requestAuth } = useAuth();

  return (
    <div className="relative">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${bgConstellations})` }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/85 to-background" />

      <Header />

      <main className="snap-container">
        {/* ─── Section 1: Hero with zodiac wheel ─── */}
        <section className="snap-section relative flex items-center justify-center overflow-hidden px-6">
          <StarField count={140} />

          {/* Rotating zodiac wheel backdrop */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <img
              src={zodiacWheel}
              alt=""
              aria-hidden
              className="animate-zodiac-slow w-[min(120vmin,1100px)] max-w-none opacity-30 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/40 to-background" style={{ background: "radial-gradient(circle at center, transparent 0%, oklch(0.16 0.04 280 / 0.65) 70%)" }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-gold backdrop-blur">
              ✦ ASTROTAROT ✦
            </div>
            <h1 className="mt-6 font-display text-5xl leading-tight md:text-7xl lg:text-8xl">
              <span className="text-gradient-gold">Tử vi · Tarot</span>
              <br />
              <span className="text-foreground">Cộng đồng Reader</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Vũ trụ huyền bí mở ra trước bạn — nơi 12 cung hoàng đạo, lá bài Tarot và những Reader chuyên nghiệp cùng hội tụ.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => requestAuth(() => {})} className="rounded-full bg-gold px-7 py-3 font-medium text-primary-foreground glow-gold transition hover:scale-105">
                ✦ Bắt đầu ngay
              </button>
              <Link to="/tarot" className="rounded-full border border-gold/60 px-7 py-3 font-medium text-gold transition hover:bg-gold/10">
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
          </motion.div>
        </section>

        {/* ─── Section 2: Khám phá + Top Reader (vertical) ─── */}
        <section className="snap-section relative flex items-center px-6 py-16">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
                  ✦ Vận mệnh
                </div>
                <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  Khám phá <span className="text-gradient-gold">vận mệnh</span><br />
                  qua Tarot &amp; Chiêm tinh hiện đại
                </h2>
                <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
                  Trải bài Tarot cá nhân hoá bởi AI dựa trên bản đồ sao của bạn, hoặc kết nối trực tiếp với Reader chuyên nghiệp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/tarot" className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105">
                    Xem Tarot Miễn phí
                  </Link>
                  <button onClick={() => openAuth("reader")} className="rounded-full border border-gold/60 px-6 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10">
                    Đăng ký Chuyên gia
                  </button>
                </div>
                <div className="mt-6">
                  <ZodiacAI />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h3 className="mb-4 font-display text-2xl text-gradient-gold">Top Reader nổi bật</h3>
                <TopReaders vertical />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Section 3: Blog ─── */}
        <section className="snap-section relative flex items-center px-6 py-16">
          <BlogToday />
        </section>

        {/* ─── Section 4: Contact ─── */}
        <section className="snap-section relative flex flex-col justify-center px-6 py-16">
          <ContactSection />
          <footer className="mt-12 text-center text-xs text-muted-foreground">
            © 2026 ASTROTAROT — Khám phá năng lượng vũ trụ
          </footer>
        </section>
      </main>
    </div>
  );
}
