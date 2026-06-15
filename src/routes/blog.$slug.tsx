import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Tag, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { getPost, POSTS } from "@/lib/blog-data";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — ASTROTAROT` },
          { name: "description", content: loaderData.post.excerpt },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt },
        ]
      : [{ title: "Bài viết — ASTROTAROT" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-4">
      <div>
        <h1 className="font-display text-5xl text-gradient-gold">Không tìm thấy</h1>
        <p className="mt-2 text-muted-foreground">Bài viết này không tồn tại hoặc đã bị gỡ.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold">Về trang chủ</Link>
      </div>
    </div>
  ),
  component: BlogDetail,
});

function BlogDetail() {
  const { post } = Route.useLoaderData();
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={50} />

      <article className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gold transition hover:text-gold-soft">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div
            className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-gold/20"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${post.color}66, transparent 60%), linear-gradient(135deg, oklch(0.25 0.1 290), oklch(0.18 0.06 280))`,
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-[10rem] opacity-30">{post.emoji}</div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 uppercase tracking-wider"
              style={{ borderColor: `${post.color}66`, color: post.color }}
            >
              <Tag className="h-3 w-3" /> {post.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {post.date}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> {post.author}
            </span>
          </div>

          <h1 className="mt-4 font-display text-4xl leading-tight text-gradient-gold md:text-5xl">
            {post.title}
          </h1>

          <p className="mt-4 text-lg italic text-muted-foreground">{post.excerpt}</p>

          <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {post.content}
          </div>
        </motion.div>

        <div className="mt-12 border-t border-gold/20 pt-8">
          <h3 className="font-display text-2xl text-gold-soft">Bài viết liên quan</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group overflow-hidden rounded-xl border border-gold/20 bg-card/40 transition hover:border-gold/50"
              >
                <div
                  className="relative aspect-[16/10]"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${p.color}55, transparent 70%), linear-gradient(135deg, oklch(0.25 0.08 290), oklch(0.18 0.05 280))`,
                  }}
                >
                  <div className="absolute inset-0 grid place-items-center text-5xl opacity-50">{p.emoji}</div>
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-medium text-foreground transition group-hover:text-gold">{p.title}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{p.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-sm text-gold transition hover:bg-gold/10">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
        </div>
      </article>
    </div>
  );
}
