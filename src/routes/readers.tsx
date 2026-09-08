import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { READERS, formatVND, type Reader } from "@/lib/mock-data";

export const Route = createFileRoute("/readers")({
  head: () => ({
    meta: [
      { title: "Tìm Reader — ASTROTAROT" },
      {
        name: "description",
        content: "Đặt lịch với các Reader Tarot & Chiêm tinh chuyên nghiệp.",
      },
    ],
  }),
  component: ReadersPage,
});

function ReadersPage() {
  return (
    <div className="relative min-h-screen">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl">
          Kết nối với <span className="text-gradient-gold">chuyên gia</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn Reader phù hợp và đặt lịch ngay. Thanh toán qua ký quỹ an toàn.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {READERS.map((r) => (
            <ReaderCard key={r.id} reader={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReaderCard({ reader }: { reader: Reader }) {
  return (
    <motion.div className="glass rounded-2xl p-6" whileHover={{ y: -4 }}>
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-gold bg-card text-3xl glow-gold">
          {reader.avatar}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-2xl text-foreground">
            {reader.name}
          </h3>
          <p className="text-sm text-muted-foreground">{reader.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-gold">★ {reader.rating}</span>
            <span className="text-muted-foreground">
              ({reader.reviews} đánh giá)
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">15 phút</div>
          <div className="font-display text-xl text-gold">
            {formatVND(reader.pricePer15m)}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{reader.bio}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {reader.specialties.map((s) => (
          <span
            key={s}
            className="rounded-full border border-mystic/50 bg-mystic/10 px-3 py-1 text-xs text-foreground/80"
          >
            {s}
          </span>
        ))}
      </div>

      <Link
        to="/readers/$id"
        params={{ id: reader.id }}
        className="mt-5 block w-full rounded-full bg-gold py-3 text-center text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
      >
        Xem hồ sơ & Book lịch ✦
      </Link>
    </motion.div>
  );
}
