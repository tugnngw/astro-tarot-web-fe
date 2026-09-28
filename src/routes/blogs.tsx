// src/routes/blogs.tsx
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Search, Sparkles, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { ListError } from "@/components/ListError";
import { Pagination } from "@/components/Pagination";
import { usePublicBlogs } from "@/features/blog/queries";
import { BlogCard } from "@/features/blog/components/BlogCard";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/blogs")({
  head: () => ({
    meta: [
      { title: "Bài viết & Nhật ký — ASTROTAROT" },
      {
        name: "description",
        content:
          "Khám phá các bài viết sâu sắc về Tarot, Chiêm tinh học, Thần số học và Chữa lành tâm hồn.",
      },
    ],
  }),
  component: BlogsPage,
});

function BlogsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 9;
  const [keyword, setKeyword] = useState("");

  const blogsQuery = usePublicBlogs({
    page,
    size: pageSize,
    keyword: keyword.trim() || undefined,
  });
  const blogs = blogsQuery.data?.content ?? [];
  const totalPages = blogsQuery.data?.totalPages ?? 1;

  const featuredBlog =
    page === 0 && !keyword.trim() && blogs.length > 0 ? blogs[0] : null;
  const regularBlogs = featuredBlog
    ? blogs.filter((b) => b.id !== featuredBlog.id)
    : blogs;

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Nhật ký Vũ trụ
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-gradient-gold">
            Tri thức & Cảm hứng
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Nơi hội tụ những góc nhìn sâu sắc về biểu tượng Tarot, dòng chảy các
            vì sao và hành trình thấu hiểu bản thân.
          </p>

          {/* Search bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/70" />
              <Input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm kiếm bài viết, tác giả..."
                className="pl-10 pr-9 h-11 rounded-full border-gold/30 bg-card/60 focus:border-gold text-sm shadow-inner"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error handling */}
        {blogsQuery.isError && (
          <ListError
            error={blogsQuery.error}
            onRetry={() => blogsQuery.refetch()}
          />
        )}

        {/* Loading state */}
        {blogsQuery.isLoading && (
          <div className="space-y-8">
            <div className="h-80 rounded-3xl border border-gold/20 bg-card/30 animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl border border-gold/15 bg-card/30 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!blogsQuery.isLoading && !blogsQuery.isError && blogs.length === 0 && (
          <div className="rounded-3xl border border-gold/20 bg-card/30 p-16 text-center max-w-xl mx-auto my-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-4">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl text-foreground">
              {keyword
                ? "Không tìm thấy bài viết"
                : "Chưa có bài viết nào được xuất bản"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {keyword
                ? `Không có kết quả nào phù hợp với từ khóa "${keyword}". Thử tìm kiếm với từ khóa khác.`
                : "Các bài viết mới đang được biên soạn và sẽ sớm ra mắt."}
            </p>
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-xs font-medium text-gold hover:bg-gold/10 transition"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        )}

        {/* Articles List */}
        {!blogsQuery.isLoading && blogs.length > 0 && (
          <div className="space-y-10">
            {/* Featured Blog */}
            {featuredBlog && (
              <Reveal>
                <BlogCard blog={featuredBlog} featured />
              </Reveal>
            )}

            {/* Grid of regular blogs */}
            {regularBlogs.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {regularBlogs.map((blog, idx) => (
                  <Reveal key={blog.id} delay={idx * 0.05}>
                    <BlogCard blog={blog} />
                  </Reveal>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-6">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={blogsQuery.data?.totalElements ?? blogs.length}
                  pageSize={pageSize}
                  onChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  unit="bài viết"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
