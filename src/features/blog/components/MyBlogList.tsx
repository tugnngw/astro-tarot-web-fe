// src/features/blog/components/MyBlogList.tsx
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  Send,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListError } from "@/components/ListError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import type { BlogResponse, BlogStatus } from "@/api/types";
import { useDeleteStaffBlog, useMyBlogs, useSubmitBlog } from "../queries";
import { BLOG_STATUS_MAP, formatBlogDate } from "../utils";
import { BlogEditorModal } from "./BlogEditorModal";
import { BlogPreviewModal } from "./BlogPreviewModal";
import { CelestialArtwork } from "@/components/CelestialArtwork";

const STATUS_FILTERS: { key: string; label: string; status?: BlogStatus }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "DRAFT", label: "Bản nháp", status: "DRAFT" },
  { key: "PENDING", label: "Chờ duyệt", status: "PENDING" },
  { key: "APPROVED", label: "Đã duyệt", status: "APPROVED" },
  { key: "REJECTED", label: "Bị từ chối", status: "REJECTED" },
  { key: "PUBLISHED", label: "Đã xuất bản", status: "PUBLISHED" },
];

export function MyBlogList() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  const [editingBlog, setEditingBlog] = useState<BlogResponse | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const [previewBlog, setPreviewBlog] = useState<BlogResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myBlogsQuery = useMyBlogs({
    page,
    size: pageSize,
    status: activeFilter === "ALL" ? undefined : (activeFilter as BlogStatus),
    keyword: keyword.trim() || undefined,
  });
  const submitMutation = useSubmitBlog();
  const deleteMutation = useDeleteStaffBlog();

  const allBlogs = myBlogsQuery.data?.content ?? [];

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (blog: BlogResponse) => {
    setEditingBlog(blog);
    setEditorOpen(true);
  };

  const handleOpenPreview = (blog: BlogResponse) => {
    setPreviewBlog(blog);
    setPreviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!submittingId) return;
    try {
      await submitMutation.mutateAsync(submittingId);
      setSubmittingId(null);
    } catch {
      // Handled in mutation toast
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch {
      // Handled in mutation toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-gradient-gold">
            Bài viết của tôi
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Quản lý các bài viết của bạn, gửi duyệt và theo dõi trạng thái xuất
            bản.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-gold hover:bg-gold-soft text-primary-foreground font-medium text-xs sm:text-sm gap-2 glow-gold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Viết bài mới
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-gold/20 bg-card/40">
          {STATUS_FILTERS.map((f) => {
            const isActive = activeFilter === f.key;

            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setActiveFilter(f.key);
                  setPage(0);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gold text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-gold/10"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Tìm theo tiêu đề, slug..."
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
      {myBlogsQuery.isError && (
        <ListError
          error={myBlogsQuery.error}
          onRetry={() => myBlogsQuery.refetch()}
        />
      )}

      {/* Loading Skeleton */}
      {myBlogsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-gold/15 bg-card/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty list */}
      {!myBlogsQuery.isLoading &&
        !myBlogsQuery.isError &&
        allBlogs.length === 0 && (
          <div className="rounded-2xl border border-gold/20 bg-card/30 p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg text-foreground">
              Chưa có bài viết nào
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {keyword || activeFilter !== "ALL"
                ? "Không tìm thấy bài viết nào khớp với điều kiện lọc."
                : "Bắt đầu chia sẻ kiến thức về Tarot, Chiêm tinh hoặc Chữa lành bằng cách tạo bài viết đầu tiên của bạn!"}
            </p>
            {!keyword && activeFilter === "ALL" && (
              <Button
                onClick={handleOpenCreate}
                className="mt-4 bg-gold hover:bg-gold-soft text-primary-foreground text-xs glow-gold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Soạn bài viết đầu tiên
              </Button>
            )}
          </div>
        )}

      {/* Blog Cards List */}
      {!myBlogsQuery.isLoading && allBlogs.length > 0 && (
        <div className="space-y-4">
          {allBlogs.map((blog) => {
            const statusMeta = BLOG_STATUS_MAP[blog.status] || {
              label: blog.status,
              badgeClass: "border-muted text-muted-foreground",
            };

            const canEdit =
              blog.status === "DRAFT" ||
              blog.status === "PENDING" ||
              blog.status === "REJECTED";
            const canSubmit =
              blog.status === "DRAFT" || blog.status === "REJECTED";
            const canDelete = blog.status === "DRAFT";

            return (
              <div
                key={blog.id}
                className="group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-card/40 p-4 transition-all hover:border-gold/50 hover:bg-card/60"
              >
                {/* Left info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-muted/20 hidden sm:block">
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

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Đường dẫn:{" "}
                        <code className="text-gold font-mono">
                          /blog/{blog.slug}
                        </code>
                      </span>
                    </div>

                    <h4 className="font-display text-base sm:text-lg font-medium text-foreground line-clamp-1 group-hover:text-gold transition">
                      {blog.title}
                    </h4>

                    {blog.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {blog.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gold/70" />{" "}
                        {formatBlogDate(blog.createdAt)}
                      </span>
                      {blog.reviewer && (
                        <span>
                          • Duyệt bởi:{" "}
                          {blog.reviewer.fullName || blog.reviewer.username}
                        </span>
                      )}
                    </div>

                    {/* Rejection Alert Box */}
                    {blog.status === "REJECTED" && blog.rejectionReason && (
                      <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-200">
                        <p className="font-semibold text-rose-300 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Lý do từ chối:
                        </p>
                        <p className="mt-0.5 pl-4 text-muted-foreground text-[11px]">
                          {blog.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 border-gold/10 pt-3 md:pt-0 w-full md:w-auto justify-end">
                  {blog.status === "PUBLISHED" && (
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

                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(blog)}
                      className="h-8 px-2.5 text-xs text-gold hover:text-gold-soft border border-gold/30 hover:bg-gold/10"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                    </Button>
                  )}

                  {canSubmit && (
                    <Button
                      size="sm"
                      onClick={() => setSubmittingId(blog.id)}
                      disabled={submitMutation.isPending}
                      className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      {blog.status === "REJECTED" ? "Gửi lại" : "Gửi duyệt"}
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(blog.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {myBlogsQuery.data && myBlogsQuery.data.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            page={page}
            totalPages={myBlogsQuery.data.totalPages}
            totalElements={myBlogsQuery.data.totalElements}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            unit="bài viết"
          />
        </div>
      )}

      {/* Editor Modal */}
      <BlogEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialBlog={editingBlog}
      />

      {/* Preview Modal */}
      <BlogPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blog={previewBlog}
      />

      {/* Confirm Submit Dialog */}
      <ConfirmDialog
        open={Boolean(submittingId)}
        title="Gửi bài viết chờ duyệt?"
        description="Bài viết sẽ được gửi đến ban quản lý để duyệt. Trong thời gian chờ duyệt hoặc sau khi xuất bản, bạn sẽ không thể chỉnh sửa bài này."
        confirmLabel="Gửi duyệt ngay"
        cancelLabel="Hủy"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmittingId(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Xóa bài viết nháp?"
        description="Hành động này không thể hoàn tác. Bản nháp bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống."
        destructive
        confirmLabel="Xóa bài viết"
        cancelLabel="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
