import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { POSTS } from "@/lib/blog-data";

const TAG_COLOR: Record<string, string> = {
  Tarot: "#facc15",
  Astrology: "#a78bfa",
  Spiritual: "#67e8f9",
  Healing: "#34d399",
};

export function BlogToday() {
  const featured = POSTS.find((p) => p.featured) ?? POSTS[0];
  const side = POSTS.filter((p) => p.slug !== featured.slug).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
            ✦ Nhật ký
          </div>
          <h3 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
            Chuyện gì đang xảy ra vậy?
          </h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
        >
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group block overflow-hidden rounded-2xl border border-gold/20 bg-card/40"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <div
                className="absolute inset-0 transition duration-700 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${featured.color}66, transparent 60%), linear-gradient(135deg, oklch(0.25 0.1 290), oklch(0.18 0.06 280))`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[12rem] opacity-30">
                {featured.emoji}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
            <div className="p-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  borderColor: `${featured.color}66`,
                  color: featured.color,
                }}
              >
                <Tag className="h-3 w-3" /> {featured.category}
              </span>
              <h4 className="mt-3 font-display text-2xl text-foreground transition group-hover:text-gold md:text-3xl">
                {featured.title}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground">
                {featured.date} · {featured.author}
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Side list */}
        <div className="flex flex-col gap-4">
          {side.map((b, i) => (
            <motion.div
              key={b.slug}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ x: -4 }}
            >
              <Link
                to="/blog/$slug"
                params={{ slug: b.slug }}
                className="group flex items-center gap-4 overflow-hidden rounded-xl border border-gold/20 bg-card/40 p-3 transition hover:border-gold/50 hover:bg-card/60"
              >
                <div
                  className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${b.color}55, transparent 70%), linear-gradient(135deg, oklch(0.25 0.08 290), oklch(0.18 0.05 280))`,
                  }}
                >
                  <div className="absolute inset-0 grid place-items-center text-4xl opacity-60">
                    {b.emoji}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="line-clamp-2 text-sm font-medium text-foreground transition group-hover:text-gold">
                    {b.title}
                  </h5>
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 uppercase tracking-wider"
                      style={{
                        borderColor: `${TAG_COLOR[b.category]}66`,
                        color: TAG_COLOR[b.category],
                      }}
                    >
                      <Tag className="h-2.5 w-2.5" /> {b.category}
                    </span>
                    <span className="text-muted-foreground">{b.date}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
