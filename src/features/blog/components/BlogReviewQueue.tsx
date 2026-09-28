// src/features/blog/components/BlogReviewQueue.tsx
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Globe,
  Search,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListError } from "@/components/ListError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import type { BlogResponse, BlogStatus } from "@/api/types";
import {
  useAllBlogs,
  useDeleteAdminBlog,
  usePublishBlog,
  useReviewBlog,
} from "../queries";
import { BLOG_STATUS_MAP, formatBlogDate } from "../utils";
import { BlogPreviewModal } from "./BlogPreviewModal";
import { BlogRejectModal } from "./BlogRejectModal";
import { CelestialArtwork } from "@/components/CelestialArtwork";

const STATUS_TABS: { key: string; label: string; status?: BlogStatus }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt", status: "PENDING" },
  { key: "APPROVED", label: "Đã duyệt", status: "APPROVED" },
  { key: "PUBLISHED", label: "Đã xuất bản", status: "PUBLISHED" },
  { key: "REJECTED", label: "Bị từ chối", status: "REJECTED" },
  { key: "DRAFT", label: "Bản nháp", status: "DRAFT" },
];

export function BlogReviewQueue() {
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [activeTab, setActiveTab] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  const [previewBlog, setPreviewBlog] = useState<BlogResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [rejectBlog, setRejectBlog] = useState<BlogResponse | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allBlogsQuery = useAllBlogs({
    page,
    size: pageSize,
    status: activeTab === "ALL" ? undefined : (activeTab as BlogStatus),
    keyword: keyword.trim() || undefined,
  });
  const pendingQuery = useAllBlogs({ size: 1, status: "PENDING" });
  const approvedQuery = useAllBlogs({ size: 1, status: "APPROVED" });
  const publishedQuery = useAllBlogs({ size: 1, status: "PUBLISHED" });
  const rejectedQuery = useAllBlogs({ size: 1, status: "REJECTED" });

  const counts = {
    pending: pendingQuery.data?.totalElements ?? 0,
    approved: approvedQuery.data?.totalElements ?? 0,
    published: publishedQuery.data?.totalElements ?? 0,
    rejected: rejectedQuery.data?.totalElements ?? 0,
  };

  const reviewMutation = useReviewBlog();
  const publishMutation = usePublishBlog();
  const deleteAdminMutation = useDeleteAdminBlog();

  const allBlogs = allBlogsQuery.data?.content ?? [];

  const handleOpenPreview = (blog: BlogResponse) => {
    setPreviewBlog(blog);
    setPreviewOpen(true);
  };

  const handleOpenReject = (blog: BlogResponse) => {
    setRejectBlog(blog);
    setRejectOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingId) return;
    try {
      await reviewMutation.mutateAsync({
        id: approvingId,
        request: { action: "APPROVED" },
      });
      setApprovingId(null);
    } catch {
      // Handled in mutation toast
    }
  };

  const handleConfirmPublish = async () => {
    if (!publishingId) return;
    try {
      await publishMutation.mutateAsync(publishingId);
      setPublishingId(null);
    } catch {
      // Handled in mutation toast
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAdminMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch {
      // Handled in mutation toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl text-gradient-gold">
          Quản lý & Duyệt bài viết
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Kiểm duyệt các bài viết do nhân viên/tác giả đóng góp, phê duyệt và
          xuất bản lên trang chủ.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs text-amber-400/90 font-medium">
            Chờ kiểm duyệt
          </p>
          <p className="text-2xl font-bold font-display text-amber-400 mt-1">
            {counts.pending}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-400/90 font-medium">
            Đã duyệt (Chờ xuất bản)
          </p>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-1">
            {counts.approved}
          </p>
        </div>

        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-xs text-gold/90 font-medium">
            Đã xuất bản công khai
          </p>
          <p className="text-2xl font-bold font-display text-gold mt-1">
            {counts.published}
          </p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-xs text-rose-400/90 font-medium">Bị từ chối</p>
          <p className="text-2xl font-bold font-display text-rose-400 mt-1">
            {counts.rejected}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-gold/20 bg-card/40">
          {STATUS_TABS.map((t) => {
            const isActive = activeTab === t.key;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveTab(t.key);
                  setPage(0);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gold text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-gold/10"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Tìm theo tiêu đề, tác giả, slug..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            className="h-9 text-xs border-gold/30 bg-card/40 focus:border-gold"
          />
        </div>
      </div>

      {/* Query error handling */}
      {allBlogsQuery.isError && (
        <ListError
          error={allBlogsQuery.error}
          onRetry={() => allBlogsQuery.refetch()}
        />
      )}

      {/* Loading Skeleton */}
      {allBlogsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-gold/15 bg-card/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty list */}
      {!allBlogsQuery.isLoading &&
        !allBlogsQuery.isError &&
        allBlogs.length === 0 && (
          <div className="rounded-2xl border border-gold/20 bg-card/30 p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg text-foreground">
              Không có bài viết nào
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {keyword || activeTab !== "ALL"
                ? "Không tìm thấy bài viết nào khớp với tiêu chí tìm kiếm."
                : "Hiện tại chưa có bài viết nào được tạo trong hệ thống."}
            </p>
          </div>
        )}

      {/* Blog Review List */}
      {!allBlogsQuery.isLoading && allBlogs.length > 0 && (
        <div className="space-y-3">
          {allBlogs.map((blog) => {
            const statusMeta = BLOG_STATUS_MAP[blog.status] || {
              label: blog.status,
              badgeClass: "border-muted text-muted-foreground",
            };

            const isPending = blog.status === "PENDING";
            const isApproved = blog.status === "APPROVED";
            const isPublished = blog.status === "PUBLISHED";

            return (
              <div
                key={blog.id}
                className="group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-card/40 p-4 transition-all hover:border-gold/50 hover:bg-card/60"
              >
                {/* Left info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-muted/20 hidden sm:block">
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

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Slug:{" "}
                        <code className="text-gold font-mono">
                          /blog/{blog.slug}
                        </code>
                      </span>
                    </div>

                    <h4 className="font-display text-base font-medium text-foreground line-clamp-1 group-hover:text-gold transition">
                      {blog.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-foreground font-medium">
                        <UserIcon className="h-3 w-3 text-gold/80" />
                        {blog.author?.fullName ||
                          blog.author?.username ||
                          "Tác giả"}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gold/70" />{" "}
                        {formatBlogDate(blog.createdAt)}
                      </span>
                      {blog.reviewer && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">
                            Duyệt bởi:{" "}
                            {blog.reviewer.fullName || blog.reviewer.username}
                          </span>
                        </>
                      )}
                    </div>

                    {blog.status === "REJECTED" && blog.rejectionReason && (
                      <p className="text-[11px] text-rose-300 italic line-clamp-1 mt-0.5">
                        Lý do từ chối: {blog.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 border-gold/10 pt-3 md:pt-0 w-full md:w-auto justify-end">
                  {isPublished && (
                    <Link
                      to="/blog/$slug"
                      params={{ slug: blog.slug }}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-gold/40 px-2.5 py-1.5 text-xs text-gold hover:bg-gold/10 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Xem bài
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenPreview(blog)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-gold/20 hover:bg-gold/10"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Xem trước
                  </Button>

                  {/* Actions for PENDING */}
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setApprovingId(blog.id)}
                        disabled={reviewMutation.isPending}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Duyệt
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenReject(blog)}
                        disabled={reviewMutation.isPending}
                        className="h-8 px-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Từ chối
                      </Button>
                    </>
                  )}

                  {/* Action for APPROVED -> PUBLISH */}
                  {isApproved && (
                    <Button
                      size="sm"
                      onClick={() => setPublishingId(blog.id)}
                      disabled={publishMutation.isPending}
                      className="h-8 px-3 text-xs bg-gold hover:bg-gold-soft text-primary-foreground font-semibold glow-gold"
                    >
                      <Globe className="h-3.5 w-3.5 mr-1" /> Xuất bản
                    </Button>
                  )}

                  {/* Admin Delete */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(blog.id)}
                    disabled={deleteAdminMutation.isPending}
                    className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    title="Xóa bài viết"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {allBlogsQuery.data && allBlogsQuery.data.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            page={page}
            totalPages={allBlogsQuery.data.totalPages}
            totalElements={allBlogsQuery.data.totalElements}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            unit="bài viết"
          />
        </div>
      )}

      {/* Preview Modal */}
      <BlogPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blog={previewBlog}
        canReview={true}
        onApprove={(b) => setApprovingId(b.id)}
        onReject={(b) => handleOpenReject(b)}
        onPublish={(b) => setPublishingId(b.id)}
      />

      {/* Reject Reason Modal */}
      <BlogRejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        blog={rejectBlog}
      />

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={Boolean(approvingId)}
        title="Duyệt bài viết này?"
        description="Bài viết sẽ được chuyển sang trạng thái ĐÃ DUYỆT (APPROVED). Sau đó bạn có thể xuất bản bài viết lên trang chủ."
        confirmLabel="Duyệt bài"
        cancelLabel="Hủy"
        onConfirm={handleConfirmApprove}
        onCancel={() => setApprovingId(null)}
      />

      {/* Confirm Publish Dialog */}
      <ConfirmDialog
        open={Boolean(publishingId)}
        title="Xuất bản bài viết lên công khai?"
        description="Bài viết sẽ chuyển sang trạng thái PUBLISHED và hiển thị công khai cho toàn bộ khách ghé thăm website."
        confirmLabel="Xuất bản ngay"
        cancelLabel="Hủy"
        onConfirm={handleConfirmPublish}
        onCancel={() => setPublishingId(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Xóa bài viết này?"
        description="Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu."
        destructive
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
