// src/features/blog/components/BlogCard.tsx
import { Link } from "@tanstack/react-router";
import { Calendar, Clock, Sparkles, User as UserIcon } from "lucide-react";
import type { BlogResponse } from "@/api/types";
import { CelestialArtwork } from "@/components/CelestialArtwork";
import { estimateReadTime, formatBlogDate } from "../utils";

export interface BlogCardProps {
  blog: BlogResponse;
  featured?: boolean;
}

/** Ảnh bìa: hiện đủ khung (không crop), nền tối nhẹ như Medium/Substack. */
function Cover({
  src,
  alt,
  seed,
  motif,
  className,
}: {
  src?: string | null;
  alt: string;
  seed: string;
  motif: "moon" | "cards";
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-muted/25 ${className ?? ""}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : null}
      <div className={`absolute inset-0 ${src ? "hidden" : "block"}`}>
        <CelestialArtwork
          seed={seed}
          motif={motif}
          frame={false}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  const readTime = estimateReadTime(blog.content);
  const formattedDate = formatBlogDate(blog.createdAt);

  if (featured) {
    // Kiểu Substack / The Atlantic: hàng ngang gọn, ảnh không chiếm nửa viewport.
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: blog.slug }}
        className="card-hover group grid overflow-hidden rounded-2xl border border-gold/25 bg-card/50 transition-all duration-300 hover:border-gold/60 sm:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]"
      >
        <div className="relative h-44 sm:h-full sm:min-h-[200px] sm:max-h-[240px]">
          <Cover
            src={blog.thumbnailUrl}
            alt={blog.title}
            seed={blog.slug}
            motif="moon"
            className="h-full w-full"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/50 bg-background/85 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> Nổi bật
          </span>
        </div>

        <div className="flex flex-col justify-center gap-2.5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gold/80" />
              {formattedDate}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-gold/80" />
              {readTime} phút đọc
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl leading-snug text-foreground transition group-hover:text-gold line-clamp-2">
            {blog.title}
          </h2>

          {blog.summary ? (
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {blog.summary}
            </p>
          ) : null}

          <div className="mt-1 flex items-center gap-2.5 pt-1">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author.fullName || blog.author.username}
                className="h-7 w-7 rounded-full object-cover border border-gold/35"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">
              {blog.author?.fullName || blog.author?.username || "Tác giả"}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: blog.slug }}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-card/40 transition-all duration-300 hover:border-gold/55 hover:bg-card/65"
    >
      <Cover
        src={blog.thumbnailUrl}
        alt={blog.title}
        seed={blog.slug}
        motif="cards"
        className="aspect-[4/3] w-full"
      />

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gold/70" />
              {formattedDate}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-gold/70" />
              {readTime} phút đọc
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 font-display text-base sm:text-lg font-medium text-foreground transition group-hover:text-gold">
            {blog.title}
          </h3>

          {blog.summary ? (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {blog.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-gold/10 pt-3">
          {blog.author?.avatar ? (
            <img
              src={blog.author.avatar}
              alt={blog.author.fullName || blog.author.username}
              className="h-6 w-6 rounded-full object-cover border border-gold/30"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
              <UserIcon className="h-3 w-3" />
            </div>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {blog.author?.fullName || blog.author?.username || "Tác giả"}
          </span>
        </div>
      </div>
    </Link>
  );
}
