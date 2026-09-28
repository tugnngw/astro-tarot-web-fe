// src/routes/blog.$slug.tsx
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Sparkles,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { getBlogBySlug } from "@/api/blog";
import { useBlogBySlug, usePublicBlogs } from "@/features/blog/queries";
import { estimateReadTime, formatBlogDate } from "@/features/blog/utils";
import { CelestialArtwork } from "@/components/CelestialArtwork";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    try {
      const blog = await getBlogBySlug(params.slug);
      return { blog };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.blog
      ? [
          { title: `${loaderData.blog.title} — ASTROTAROT` },
          {
            name: "description",
            content: loaderData.blog.summary || loaderData.blog.title,
          },
          { property: "og:title", content: loaderData.blog.title },
          {
            property: "og:description",
            content: loaderData.blog.summary || "",
          },
          { property: "og:image", content: loaderData.blog.thumbnailUrl || "" },
        ]
      : [{ title: "Bài viết — ASTROTAROT" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-4 bg-background">
      <div className="max-w-md p-8 rounded-3xl border border-gold/20 bg-card/40 backdrop-blur-xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-4 text-2xl">
          ✦
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-gradient-gold">
          Không tìm thấy bài viết
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bài viết này không tồn tại, chưa được xuất bản hoặc đã bị gỡ khỏi hệ
          thống.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/blogs"
            className="inline-block rounded-full bg-gold px-6 py-2.5 text-xs sm:text-sm font-medium text-primary-foreground glow-gold transition hover:bg-gold-soft"
          >
            Xem tất cả bài viết
          </Link>
          <Link
            to="/"
            className="inline-block rounded-full border border-gold/40 px-6 py-2.5 text-xs sm:text-sm font-medium text-gold hover:bg-gold/10 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  ),
  component: BlogDetail,
});

function BlogDetail() {
  const { blog: initialBlog } = Route.useLoaderData();
  const { slug } = Route.useParams();

  // Keep live sync with react-query
  const blogQuery = useBlogBySlug(slug);
  const blog = blogQuery.data ?? initialBlog;

  const publicBlogsQuery = usePublicBlogs({ page: 0, size: 4 });
  const related = (publicBlogsQuery.data?.content ?? [])
    .filter((b) => b.slug !== blog.slug)
    .slice(0, 3);

  const formattedDate = formatBlogDate(blog.createdAt);
  const readTime = estimateReadTime(blog.content);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          text: blog.summary || blog.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm");
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="relative min-h-screen">
      <Header />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation & back */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gold transition hover:text-gold-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài viết
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card/60 px-3.5 py-1.5 text-xs text-gold hover:bg-gold/10 transition"
          >
            <Share2 className="h-3.5 w-3.5" /> Chia sẻ
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold/80" />{" "}
                {formattedDate}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold/80" /> {readTime} phút
                đọc
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                <UserIcon className="h-3.5 w-3.5 text-gold" />{" "}
                {blog.author?.fullName ||
                  blog.author?.username ||
                  "AstroTarot Contributor"}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-gradient-gold">
              {blog.title}
            </h1>

            {blog.summary && (
              <p className="text-base sm:text-lg italic text-muted-foreground leading-relaxed border-l-2 border-gold/40 pl-4 py-1">
                {blog.summary}
              </p>
            )}
          </div>

          {/* Cover Art / Thumbnail */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-gold/30 bg-muted/20 shadow-2xl shadow-gold/5">
            {blog.thumbnailUrl ? (
              <img
                src={blog.thumbnailUrl}
                alt={blog.title}
                className="h-full w-full object-cover"
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
                motif="moon"
                frame={false}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Main Article Content */}
          <div className="pt-4 border-t border-gold/15">
            <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-base sm:text-lg">
              {blog.content}
            </div>
          </div>

          {/* Author Card */}
          <div className="mt-12 rounded-2xl border border-gold/20 bg-card/40 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author.fullName || blog.author.username}
                className="h-16 w-16 rounded-full object-cover border-2 border-gold/40 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center text-gold text-2xl shrink-0">
                <UserIcon className="h-8 w-8" />
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h4 className="font-display text-lg text-foreground font-semibold">
                {blog.author?.fullName ||
                  blog.author?.username ||
                  "Tác giả AstroTarot"}
              </h4>
              <p className="text-xs text-gold/80 mt-0.5">
                Tác giả & Đóng góp nội dung
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Chia sẻ những hiểu biết sâu sắc và năng lượng tích cực qua từng
                trải bài Tarot, bản đồ sao và chiêm nghiệm vũ trụ.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-gold/20 pt-10">
            <h3 className="font-display text-2xl text-gradient-gold mb-6">
              Bài viết cùng chuyên mục
            </h3>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-card/40 transition hover:border-gold/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 ${p.thumbnailUrl ? "hidden" : "block"}`}
                    >
                      <CelestialArtwork
                        seed={p.slug}
                        motif="cards"
                        frame={false}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h5 className="line-clamp-2 text-sm font-medium text-foreground transition group-hover:text-gold">
                      {p.title}
                    </h5>
                    <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{formatBlogDate(p.createdAt)}</span>
                      <span>{estimateReadTime(p.content)} phút đọc</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-xs sm:text-sm font-medium text-gold transition hover:bg-gold/10"
          >
            <ArrowLeft className="h-4 w-4" /> Xem toàn bộ kho lưu trữ bài viết
          </Link>
        </div>
      </article>
    </div>
  );
}
