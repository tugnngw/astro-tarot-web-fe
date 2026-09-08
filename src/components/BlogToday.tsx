import { Reveal } from "@/components/Reveal";
import { Tag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { POSTS, type BlogPost } from "@/lib/blog-data";
import {
  CelestialArtwork,
  type CelestialMotif,
} from "@/components/CelestialArtwork";

/**
 * Màu nhãn giữ trong họ vàng - tím - xanh mực của app.
 * Bảng cũ dùng vàng chanh, cyan và xanh ngọc bão hoà, đứng cạnh nền tím
 * đậm thì chói và phá tông chung.
 */
const TAG_COLOR: Record<BlogPost["category"], string> = {
  Tarot: "#e2b75c",
  Astrology: "#b9a2f0",
  Spiritual: "#9fb6e8",
  Healing: "#a8c9b5",
};

/** Hoạ tiết minh hoạ theo chủ đề bài viết. */
const POST_MOTIF: Record<BlogPost["category"], CelestialMotif> = {
  Astrology: "moon",
  Tarot: "cards",
  Healing: "lotus",
  Spiritual: "numerology",
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
        <Reveal>
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="card-hover group block overflow-hidden rounded-2xl border border-gold/20 bg-card/40"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <CelestialArtwork
                seed={featured.slug}
                motif={POST_MOTIF[featured.category]}
                frame={false}
                className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            </div>
            <div className="p-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  borderColor: `${TAG_COLOR[featured.category]}66`,
                  color: TAG_COLOR[featured.category],
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
        </Reveal>

        {/* Side list */}
        <div className="flex flex-col gap-4">
          {side.map((b, i) => (
            <Reveal key={b.slug} delay={i * 0.07}>
              <Link
                to="/blog/$slug"
                params={{ slug: b.slug }}
                className="card-hover group flex items-center gap-4 overflow-hidden rounded-xl border border-gold/20 bg-card/40 p-3 hover:bg-card/60"
              >
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                  <CelestialArtwork
                    seed={b.slug}
                    motif={POST_MOTIF[b.category]}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                  />
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
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
