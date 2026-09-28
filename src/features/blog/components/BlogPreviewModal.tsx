// src/features/blog/components/BlogPreviewModal.tsx
import {
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

        <article className="mt-4 space-y-6">
          {/* Cover Artwork */}
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-gold/20 bg-card/60">
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

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-b border-gold/10 pb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold/80" /> Ngày tạo:{" "}
              {formattedDate}
            </span>
            {blog.updatedAt !== blog.createdAt && (
              <span>(Cập nhật: {updatedDate})</span>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gold/80" /> {readTime} phút đọc
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
              <UserIcon className="h-3.5 w-3.5 text-gold" />{" "}
              {blog.author?.fullName || blog.author?.username}
            </span>
            {blog.reviewer && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Duyệt bởi:{" "}
                  {blog.reviewer?.fullName || blog.reviewer?.username}
                </span>
              </>
            )}
          </div>

          {/* Title & Summary */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-gradient-gold leading-tight">
              {blog.title}
            </h1>
            {blog.summary && (
              <p className="mt-3 text-base sm:text-lg italic text-muted-foreground leading-relaxed border-l-2 border-gold/40 pl-4 py-1">
                {blog.summary}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm sm:text-base border-t border-gold/10 pt-6">
            {blog.content}
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
}
