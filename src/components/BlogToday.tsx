// src/components/BlogToday.tsx
import { Reveal } from "@/components/Reveal";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CelestialArtwork } from "@/components/CelestialArtwork";
import { usePublicBlogs } from "@/features/blog/queries";
import { formatBlogDate } from "@/features/blog/utils";

export function BlogToday() {
  const blogsQuery = usePublicBlogs({ page: 0, size: 5 });
  const blogs = blogsQuery.data?.content ?? [];

  if (blogsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Nhật ký Vũ trụ
            </div>
            <h3 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
              Chuyện gì đang xảy ra vậy?
            </h3>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-96 rounded-2xl border border-gold/20 bg-card/30 animate-pulse" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-gold/15 bg-card/30 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  const featured = blogs[0];
  const side = blogs.slice(1, 5);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Nhật ký Vũ trụ
          </div>
          <h3 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
            Chuyện gì đang xảy ra vậy?
          </h3>
        </div>

        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-5 py-2 text-xs font-medium text-gold hover:bg-gold/10 hover:border-gold transition self-start sm:self-auto"
        >
          Xem tất cả bài viết <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Featured Card */}
        <Reveal>
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="card-hover group block overflow-hidden rounded-2xl border border-gold/20 bg-card/40 hover:border-gold/50 transition-all duration-300"
          >
            <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted/20 p-3">
              {featured.thumbnailUrl ? (
                <img
                  src={featured.thumbnailUrl}
                  alt={featured.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 ${featured.thumbnailUrl ? "hidden" : "block"}`}
              >
                <CelestialArtwork
                  seed={featured.slug}
                  motif="moon"
                  frame={false}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            </div>

            <div className="p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gold">
                <Sparkles className="h-3 w-3" /> Nổi bật
              </span>
              <h4 className="mt-3 font-display text-2xl text-foreground transition group-hover:text-gold md:text-3xl">
                {featured.title}
              </h4>
              {featured.summary && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {featured.summary}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gold/70" />{" "}
                  {formatBlogDate(featured.createdAt)}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-gold/70" />{" "}
                  {featured.author?.fullName ||
                    featured.author?.username ||
                    "Tác giả"}
                </span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* Side list */}
        <div className="flex flex-col gap-4">
          {side.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.07}>
              <Link
                to="/blog/$slug"
                params={{ slug: b.slug }}
                className="card-hover group flex items-center gap-4 overflow-hidden rounded-xl border border-gold/20 bg-card/40 p-3 hover:bg-card/60 transition"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                  {b.thumbnailUrl ? (
                    <img
                      src={b.thumbnailUrl}
                      alt={b.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 ${b.thumbnailUrl ? "hidden" : "block"}`}
                  >
                    <CelestialArtwork
                      seed={b.slug}
                      motif="cards"
                      className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="line-clamp-2 text-sm font-medium text-foreground transition group-hover:text-gold">
                    {b.title}
                  </h5>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{formatBlogDate(b.createdAt)}</span>
                    <span>•</span>
                    <span>{b.author?.fullName || b.author?.username}</span>
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
