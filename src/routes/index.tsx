import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { DailyCardDraw } from "@/components/DailyCardDraw";
import { TopReaders } from "@/components/TopReaders";
import { BlogToday } from "@/components/BlogToday";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Reveal } from "@/components/Reveal";
import { WhatYouCanDo } from "@/components/WhatYouCanDo";
import { FaqSection } from "@/components/FaqSection";
import { useAuth } from "@/lib/auth-context";
import { TarotWheel } from "@/components/TarotWheel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTROTAROT — Giới thiệu · Tử vi · Tarot AI · Cộng đồng Reader" },
      {
        name: "description",
        content:
          "Trải bài Tarot miễn phí cùng AI đọc theo bản đồ sao, đặt lịch với Reader thật, và mua bộ bài, đá khoáng, phụ kiện trải bài.",
      },
      {
        property: "og:title",
        content: "ASTROTAROT — Tử vi · Tarot · Cộng đồng",
      },
      {
        property: "og:description",
        content:
          "Rút bài miễn phí, không cần tài khoản. AI đọc theo câu hỏi và bản đồ sao của bạn.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { openAuth } = useAuth();

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
              Đặt một câu hỏi, AI rút bài và đọc theo bản đồ sao của bạn. Cần
              sâu hơn thì có Reader thật. Miễn phí, không cần tài khoản.
            </p>
            {/* Nút chính trước đây gọi requestAuth, tức là bắt đăng nhập ngay
                từ cú bấm đầu tiên — trong khi trải bài AI vốn không cần tài
                khoản. Rào người dùng lại trước khi họ thấy giá trị là cách
                nhanh nhất để mất họ. Giờ đi thẳng vào trang trải bài. */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/tarot"
                className="pointer-events-auto rounded-full bg-gold px-7 py-3 font-medium text-primary-foreground glow-gold transition hover:scale-105"
              >
                ✦ Trải bài miễn phí
              </Link>
              <Link
                to="/readers"
                className="pointer-events-auto rounded-full border border-gold/60 px-7 py-3 font-medium text-gold transition hover:bg-gold/10"
              >
                Đặt lịch Reader
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
        {/* ─── Section 2: Rút thử một lá + Top Reader ───
            Khối cũ ở đây là một tiêu đề chung chung cộng card "AI Zodiac
            Oracle" chỉ có ô chọn cung hoàng đạo mà chọn xong chẳng đổi gì —
            trông như tương tác được nhưng thực ra không. Thay bằng việc cho
            người dùng lật một lá bài thật ngay lập tức. */}
        <section className="snap-section relative flex items-center px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
              <Reveal>
                <DailyCardDraw />
              </Reveal>
              <Reveal delay={0.1}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl text-gradient-gold">
                    Reader đang nhận lịch
                  </h2>
                  <Link
                    to="/readers"
                    className="shrink-0 text-xs text-gold hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>
                <TopReaders vertical />
                <button
                  onClick={() => openAuth("reader")}
                  className="mt-4 w-full rounded-full border border-gold/40 py-2.5 text-xs text-gold transition hover:bg-gold/10"
                >
                  Bạn là Reader? Đăng ký nhận khách
                </button>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ─── Section 3: Ba việc làm được ở đây ─── */}
        <section className="snap-section relative flex items-center px-6">
          <WhatYouCanDo />
        </section>

        {/* ─── Section 4: Shop ─── */}
        <section id="shop" className="snap-section relative flex items-center px-6">
          <Reveal className="w-full">
            <FeaturedProducts />
          </Reveal>
        </section>

        {/* ─── Section 5: Nhật ký ─── */}
        <section className="snap-section relative flex items-center px-6">
          <Reveal className="w-full">
            <BlogToday />
          </Reveal>
        </section>

        {/* ─── Section 6: FAQ ───
            Thay khối "Liên hệ với chúng tôi" cũ: nó in email, hotline và địa
            chỉ văn phòng đều là dữ liệu bịa, kèm form gửi tin nhắn không nối
            vào đâu. Thông tin liên hệ giả trên trang chủ làm mất lòng tin
            nhanh hơn bất cứ thứ gì. */}
        <section className="snap-section relative flex items-center px-6">
          <FaqSection />
        </section>

        {/* ─── Kết: mời hành động lần cuối ─── */}
        <section className="snap-section relative flex flex-col justify-center px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
                ✦ Bắt đầu thôi
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">
                Lá bài đầu tiên đang chờ bạn
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Không cần tài khoản, không cần biết gì về Tarot. Chỉ cần một câu
                hỏi bạn đang mang trong lòng.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/tarot"
                  className="rounded-full bg-gold px-7 py-3 font-medium text-primary-foreground glow-gold transition hover:scale-105"
                >
                  ✦ Trải bài miễn phí
                </Link>
                <Link
                  to="/readers"
                  className="rounded-full border border-gold/60 px-7 py-3 font-medium text-gold transition hover:bg-gold/10"
                >
                  Đặt lịch Reader
                </Link>
              </div>
            </div>
          </Reveal>

          <footer className="mt-16 border-t border-border/50 pt-8 text-center">
            <p className="font-display text-lg tracking-[0.2em] text-gradient-gold">
              ASTROTAROT
            </p>
            <nav className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <Link to="/tarot" className="transition hover:text-gold">
                Tarot AI
              </Link>
              <Link to="/readers" className="transition hover:text-gold">
                Reader
              </Link>
              <Link to="/shop" className="transition hover:text-gold">
                Cửa hàng
              </Link>
            </nav>
            <p className="mt-6 text-xs text-muted-foreground">
              © 2026 ASTROTAROT — Khám phá năng lượng vũ trụ
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
