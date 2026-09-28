// src/features/blog/components/BlogEditorModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Eye,
  FileEdit,
  ImageIcon,
  Link as LinkIcon,
  Lock,
  PenTool,
  RefreshCw,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlogResponse } from "@/api/types";
import { useCreateBlog, useUpdateBlog } from "../queries";
import { slugifyVietnamese } from "../utils";

interface BlogEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBlog?: BlogResponse | null;
  onSaved?: (blog: BlogResponse) => void;
}

export function BlogEditorModal({
  open,
  onOpenChange,
  initialBlog,
  onSaved,
}: BlogEditorModalProps) {
  const isEditing = Boolean(initialBlog);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [summary, setSummary] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (initialBlog) {
        setTitle(initialBlog.title || "");
        setSlug(initialBlog.slug || "");
        setAutoSlug(false);
        setSummary(initialBlog.summary || "");
        setThumbnailUrl(initialBlog.thumbnailUrl || "");
        setContent(initialBlog.content || "");
      } else {
        setTitle("");
        setSlug("");
        setAutoSlug(true);
        setSummary("");
        setThumbnailUrl("");
        setContent("");
      }
      setErrors({});
      setTab("edit");
    }
  }, [open, initialBlog]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugifyVietnamese(val));
    }
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: "" }));
    }
    if (errors.slug && autoSlug) {
      setErrors((prev) => ({ ...prev, slug: "" }));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    setAutoSlug(false);
    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const t = title.trim();
    const s = slug.trim();
    const c = content.trim();

    if (!t) {
      errs.title = "Tiêu đề bài viết không được để trống";
    } else if (t.length > 255) {
      errs.title = "Tiêu đề tối đa 255 ký tự";
    }

    if (!s) {
      errs.slug = "Đường dẫn (slug) không được để trống";
    } else if (s.length > 255) {
      errs.slug = "Slug tối đa 255 ký tự";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      errs.slug =
        "Slug chỉ được chứa chữ cái thường không dấu, số và dấu gạch ngang";
    }

    if (summary && summary.length > 500) {
      errs.summary = "Tóm tắt tối đa 500 ký tự";
    }

    if (thumbnailUrl && thumbnailUrl.length > 500) {
      errs.thumbnailUrl = "Đường dẫn ảnh bìa tối đa 500 ký tự";
    }

    if (!c) {
      errs.content = "Nội dung bài viết không được để trống";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isEditing && initialBlog) {
        const res = await updateMutation.mutateAsync({
          id: initialBlog.id,
          data: {
            title: title.trim(),
            slug: slug.trim(),
            summary: summary.trim() || undefined,
            content: content.trim(),
            thumbnailUrl: thumbnailUrl.trim() || undefined,
          },
        });
        onSaved?.(res);
      } else {
        const res = await createMutation.mutateAsync({
          title: title.trim(),
          slug: slug.trim(),
          summary: summary.trim() || undefined,
          content: content.trim(),
          thumbnailUrl: thumbnailUrl.trim() || undefined,
        });
        onSaved?.(res);
      }
      onOpenChange(false);
    } catch {
      // Error handled in mutation toast
    }
  };

  const insertSnippet = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById(
      "blog-content-input",
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "văn bản"}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || "văn bản".length),
      );
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col border-gold/30 bg-background/95 backdrop-blur-2xl p-6 sm:p-8">
        <DialogHeader className="border-b border-gold/15 pb-4">
          <DialogTitle className="font-display text-2xl text-gradient-gold flex items-center gap-2">
            <PenTool className="h-5 w-5 text-gold" />
            {isEditing ? "Chỉnh sửa bài viết" : "Soạn thảo bài viết mới"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            {isEditing
              ? "Cập nhật nội dung bài viết. Lưu ý: nếu bài đang ở trạng thái Chờ duyệt hoặc Bị từ chối, sau khi sửa bài sẽ quay về Nháp."
              : "Bài viết mới sẽ bắt đầu ở trạng thái Nháp (DRAFT). Bạn có thể chỉnh sửa trước khi gửi duyệt."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="blog-title"
                className="text-xs font-semibold text-foreground"
              >
                Tiêu đề bài viết <span className="text-rose-400">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {title.length}/255
              </span>
            </div>
            <Input
              id="blog-title"
              value={title}
              maxLength={255}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
              className="border-gold/30 bg-card/40 focus:border-gold text-sm sm:text-base font-medium"
            />
            {errors.title && (
              <p className="text-xs text-rose-400">{errors.title}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="blog-slug"
                  className="text-xs font-semibold text-foreground"
                >
                  Đường dẫn (Slug URL) <span className="text-rose-400">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    if (!autoSlug) {
                      setAutoSlug(true);
                      setSlug(slugifyVietnamese(title));
                    } else {
                      setAutoSlug(false);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                >
                  {autoSlug ? (
                    <>
                      <Lock className="h-3 w-3" /> Tự động tạo theo tiêu đề
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" /> Tùy chỉnh thủ công
                    </>
                  )}
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {slug.length}/255
              </span>
            </div>
            <div className="flex items-center rounded-md border border-gold/30 bg-card/40 px-3 focus-within:border-gold">
              <span className="text-xs text-muted-foreground select-none">
                /blog/
              </span>
              <input
                id="blog-slug"
                value={slug}
                maxLength={255}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="duong-dan-bai-viet"
                className="w-full bg-transparent px-1 py-2 text-xs sm:text-sm font-mono text-gold outline-none"
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-rose-400">{errors.slug}</p>
            )}
          </div>

          {/* Summary & Thumbnail */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="blog-summary"
                  className="text-xs font-semibold text-foreground"
                >
                  Tóm tắt ngắn (Excerpt)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {summary.length}/500
                </span>
              </div>
              <Textarea
                id="blog-summary"
                rows={3}
                maxLength={500}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (errors.summary)
                    setErrors((prev) => ({ ...prev, summary: "" }));
                }}
                placeholder="Tóm tắt ngắn gọn 1-2 câu về nội dung bài viết..."
                className="border-gold/30 bg-card/40 focus:border-gold text-xs sm:text-sm resize-none"
              />
              {errors.summary && (
                <p className="text-xs text-rose-400">{errors.summary}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="blog-thumbnail"
                  className="text-xs font-semibold text-foreground"
                >
                  Ảnh bìa (Thumbnail URL)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {thumbnailUrl.length}/500
                </span>
              </div>
              <Input
                id="blog-thumbnail"
                value={thumbnailUrl}
                maxLength={500}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  if (errors.thumbnailUrl)
                    setErrors((prev) => ({ ...prev, thumbnailUrl: "" }));
                }}
                placeholder="https://example.com/image.jpg"
                className="border-gold/30 bg-card/40 focus:border-gold text-xs sm:text-sm font-mono"
              />
              {thumbnailUrl ? (
                <div className="mt-2 relative h-16 w-full rounded-md border border-gold/20 overflow-hidden bg-muted/20">
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}
              {errors.thumbnailUrl && (
                <p className="text-xs text-rose-400">{errors.thumbnailUrl}</p>
              )}
            </div>
          </div>

          {/* Content Editor & Preview Tabs */}
          <div className="space-y-1.5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground">
                Nội dung bài viết <span className="text-rose-400">*</span>
              </Label>
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "edit" | "preview")}
              >
                <TabsList className="h-8 border border-gold/20 bg-card/60 p-0.5">
                  <TabsTrigger
                    value="edit"
                    className="text-xs px-3 h-7 data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
                  >
                    <FileEdit className="h-3.5 w-3.5 mr-1" /> Soạn thảo
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="text-xs px-3 h-7 data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Xem trước
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {tab === "edit" ? (
              <div className="space-y-2">
                {/* Format toolbar */}
                <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-gold/30 bg-card/80 p-1.5 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => insertSnippet("## ", "\n")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold font-bold"
                    title="Tiêu đề mục (H2)"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("### ", "\n")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold font-semibold"
                    title="Tiêu đề phụ (H3)"
                  >
                    H3
                  </button>
                  <span className="text-gold/30">|</span>
                  <button
                    type="button"
                    onClick={() => insertSnippet("**", "**")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold font-bold"
                    title="In đậm"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("*", "*")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold italic"
                    title="In nghiêng"
                  >
                    I
                  </button>
                  <span className="text-gold/30">|</span>
                  <button
                    type="button"
                    onClick={() => insertSnippet("> ", "\n")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold"
                    title="Trích dẫn"
                  >
                    “ Trích dẫn
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("• ")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold"
                    title="Danh sách"
                  >
                    • Danh sách
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("![Mô tả ảnh](", ")")}
                    className="rounded px-2 py-1 hover:bg-gold/20 hover:text-gold"
                    title="Chèn ảnh"
                  >
                    🖼️ Ảnh
                  </button>
                </div>
                <Textarea
                  id="blog-content-input"
                  rows={12}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content)
                      setErrors((prev) => ({ ...prev, content: "" }));
                  }}
                  placeholder="Viết nội dung bài viết ở đây... Bạn có thể xuống dòng, chia đoạn và dùng các cú pháp đánh dấu cơ bản."
                  className="rounded-t-none border-t-0 border-gold/30 bg-card/40 focus:border-gold font-mono text-xs sm:text-sm leading-relaxed"
                />
              </div>
            ) : (
              <div className="min-h-[300px] max-h-[400px] overflow-y-auto rounded-lg border border-gold/30 bg-card/30 p-5 text-sm leading-relaxed whitespace-pre-wrap">
                {content ? (
                  content
                ) : (
                  <p className="text-muted-foreground italic text-center py-10">
                    Chưa có nội dung để xem trước...
                  </p>
                )}
              </div>
            )}
            {errors.content && (
              <p className="text-xs text-rose-400">{errors.content}</p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-gold/15 pt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="border border-gold/20 hover:bg-gold/10 text-muted-foreground"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-gold hover:bg-gold-soft text-primary-foreground font-semibold glow-gold"
          >
            {isPending
              ? "Đang lưu bài viết..."
              : isEditing
                ? "Cập nhật bài viết"
                : "Lưu bản nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
