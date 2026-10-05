// src/routes/blog.$slug.tsx
// Layout đọc bài theo kiểu Medium: cột hẹp, ảnh hiện đủ khung (không crop).
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
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

      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gold transition hover:text-gold-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5"
        >
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold/80" />
                {formattedDate}
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold/80" /> {readTime} phút
                đọc
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <UserIcon className="h-3.5 w-3.5 text-gold" />
                {blog.author?.fullName ||
                  blog.author?.username ||
                  "AstroTarot Contributor"}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.15rem] leading-snug text-gradient-gold">
              {blog.title}
            </h1>

            {blog.summary ? (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed border-l-2 border-gold/35 pl-3.5">
                {blog.summary}
              </p>
            ) : null}
          </header>

          {/* Ảnh hiện nguyên khung — không ép 16:9 crop lá bài dọc */}
          <figure className="overflow-hidden rounded-2xl border border-gold/25 bg-muted/20">
            <div className="flex max-h-[min(68vh,560px)] items-center justify-center p-3 sm:p-5">
              {blog.thumbnailUrl ? (
                <img
                  src={blog.thumbnailUrl}
                  alt={blog.title}
                  className="max-h-[min(62vh,520px)] w-auto max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="aspect-[16/9] w-full">
                  <CelestialArtwork
                    seed={blog.slug}
                    motif="moon"
                    frame={false}
                    className="h-full w-full"
                  />
                </div>
              )}
            </div>
          </figure>

          <div className="border-t border-gold/15 pt-6">
            <div className="mx-auto max-w-2xl text-[1.05rem] sm:text-lg leading-[1.75] text-foreground/90 whitespace-pre-wrap">
              {blog.content}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-gold/20 bg-card/40 p-5 sm:flex-row sm:items-start">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author.fullName || blog.author.username}
                className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-gold/40"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold/40 bg-gold/10 text-gold">
                <UserIcon className="h-7 w-7" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-display text-base font-semibold text-foreground">
                {blog.author?.fullName ||
                  blog.author?.username ||
                  "Tác giả AstroTarot"}
              </h4>
              <p className="mt-0.5 text-xs text-gold/80">
                Tác giả & Đóng góp nội dung
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Chia sẻ góc nhìn về Tarot, chiêm tinh và hành trình hiểu mình.
              </p>
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <div className="mt-12 border-t border-gold/20 pt-8">
            <h3 className="mb-5 font-display text-xl text-gradient-gold">
              Đọc tiếp
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="card-hover group flex flex-col overflow-hidden rounded-xl border border-gold/20 bg-card/40 transition hover:border-gold/50"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/20 p-2">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.title}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <CelestialArtwork
                        seed={p.slug}
                        motif="cards"
                        frame={false}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <h5 className="line-clamp-2 text-sm font-medium text-foreground transition group-hover:text-gold">
                      {p.title}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatBlogDate(p.createdAt)}</span>
                      <span>{estimateReadTime(p.content)} phút</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2 text-xs sm:text-sm font-medium text-gold transition hover:bg-gold/10"
          >
            <ArrowLeft className="h-4 w-4" /> Tất cả bài viết
          </Link>
        </div>
      </article>
    </div>
  );
}
