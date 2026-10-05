// src/features/blog/components/BlogPreviewModal.tsx
// Layout bài viết khớp trang public /blog/$slug (title → ảnh contain → nội dung).
import {
  Calendar,
  Clock,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BlogResponse } from "@/api/types";
import { BLOG_STATUS_MAP, estimateReadTime, formatBlogDate } from "../utils";
import { CelestialArtwork } from "@/components/CelestialArtwork";

interface BlogPreviewModalProps {
  blog: BlogResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (blog: BlogResponse) => void;
  onReject?: (blog: BlogResponse) => void;
  onPublish?: (blog: BlogResponse) => void;
  canReview?: boolean;
}

export function BlogPreviewModal({
  blog,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onPublish,
  canReview = false,
}: BlogPreviewModalProps) {
  if (!blog) return null;

  const statusInfo = BLOG_STATUS_MAP[blog.status] || {
    label: blog.status,
    badgeClass: "border-muted text-muted-foreground",
  };
  const readTime = estimateReadTime(blog.content);
  const formattedDate = formatBlogDate(blog.createdAt);
  const updatedDate = formatBlogDate(blog.updatedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-gold/30 bg-background/95 backdrop-blur-2xl p-6 sm:p-8">
        <DialogHeader className="border-b border-gold/15 pb-4">
          <DialogTitle className="sr-only">Xem trước: {blog.title}</DialogTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </span>
              <span className="text-xs text-muted-foreground">
                Slug: <code className="text-gold font-mono">{blog.slug}</code>
              </span>
            </div>

            {canReview && (
              <div className="flex items-center gap-2">
                {blog.status === "PENDING" && onApprove && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onApprove(blog);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    Duyệt bài
                  </Button>
                )}
                {blog.status === "PENDING" && onReject && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onOpenChange(false);
                      onReject(blog);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
                  >
                    Từ chối
                  </Button>
                )}
                {blog.status === "APPROVED" && onPublish && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onPublish(blog);
                    }}
                    className="bg-gold hover:bg-gold-soft text-primary-foreground font-medium text-xs h-8 glow-gold"
                  >
                    Xuất bản ngay
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {blog.status === "REJECTED" && blog.rejectionReason && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200">
            <p className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
              <span>⚠️</span> Lý do từ chối:
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">
              {blog.rejectionReason}
            </p>
          </div>
        )}

        {/* Khớp layout public blog.$slug: meta → title → summary → ảnh contain → nội dung */}
        <article className="mx-auto mt-4 max-w-3xl space-y-5">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold/80" />
                {formattedDate}
                {blog.updatedAt !== blog.createdAt ? (
                  <span className="text-muted-foreground/80">
                    {" "}
                    (Cập nhật: {updatedDate})
                  </span>
                ) : null}
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold/80" /> {readTime} phút
                đọc
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <UserIcon className="h-3.5 w-3.5 text-gold" />
                {blog.author?.fullName || blog.author?.username}
              </span>
              {blog.reviewer ? (
                <>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Duyệt bởi:{" "}
                    {blog.reviewer?.fullName || blog.reviewer?.username}
                  </span>
                </>
              ) : null}
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
        </article>
      </DialogContent>
    </Dialog>
  );
}
