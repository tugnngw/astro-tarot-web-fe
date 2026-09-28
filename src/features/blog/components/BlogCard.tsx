// src/features/blog/components/BlogCard.tsx
import { Link } from "@tanstack/react-router";
import { Calendar, Clock, Sparkles, User as UserIcon } from "lucide-react";
import type { BlogResponse } from "@/api/types";
import { CelestialArtwork } from "@/components/CelestialArtwork";
import { BLOG_STATUS_MAP, estimateReadTime, formatBlogDate } from "../utils";

export interface BlogCardProps {
  blog: BlogResponse;
  featured?: boolean;
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  const readTime = estimateReadTime(blog.content);
  const formattedDate = formatBlogDate(blog.createdAt);

  if (featured) {
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: blog.slug }}
        className="card-hover group relative block overflow-hidden rounded-3xl border border-gold/30 bg-card/60 transition-all duration-300 hover:border-gold hover:shadow-2xl hover:shadow-gold/10"
      >
        <div className="grid lg:grid-cols-12 gap-0">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-7 overflow-hidden bg-muted/20">
            {blog.thumbnailUrl ? (
              <img
                src={blog.thumbnailUrl}
                alt={blog.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  // Fallback when image fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : null}
            <div
              className={`absolute inset-0 ${blog.thumbnailUrl ? "hidden" : "block"}`}
            >
              <CelestialArtwork
                seed={blog.slug}
                motif="moon"
                frame={false}
                className="h-full w-full transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/90" />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-background/80 backdrop-blur-md px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
                <Sparkles className="h-3 w-3" /> Nổi bật
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gold/80" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gold/80" />
                  {readTime} phút đọc
                </span>
              </div>

              <h2 className="mt-4 font-display text-2xl sm:text-3xl lg:text-4xl leading-tight text-foreground transition group-hover:text-gold">
                {blog.title}
              </h2>

              {blog.summary && (
                <p className="mt-3 line-clamp-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {blog.summary}
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gold/15 flex items-center gap-3">
              {blog.author?.avatar ? (
                <img
                  src={blog.author.avatar}
                  alt={blog.author.fullName || blog.author.username}
                  className="h-9 w-9 rounded-full object-cover border border-gold/40"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {blog.author?.fullName || blog.author?.username || "Tác giả"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  AstroTarot Contributor
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: blog.slug }}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-card/40 transition-all duration-300 hover:border-gold/60 hover:bg-card/70"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
        {blog.thumbnailUrl ? (
          <img
            src={blog.thumbnailUrl}
            alt={blog.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 ${blog.thumbnailUrl ? "hidden" : "block"}`}
        >
          <CelestialArtwork
            seed={blog.slug}
            motif="cards"
            frame={false}
            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gold/70" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-gold/70" />
              {readTime} phút đọc
            </span>
          </div>

          <h3 className="mt-2.5 line-clamp-2 font-display text-lg font-medium text-foreground transition group-hover:text-gold">
            {blog.title}
          </h3>

          {blog.summary && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {blog.summary}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gold/10 flex items-center gap-2.5">
          {blog.author?.avatar ? (
            <img
              src={blog.author.avatar}
              alt={blog.author.fullName || blog.author.username}
              className="h-7 w-7 rounded-full object-cover border border-gold/30"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
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
