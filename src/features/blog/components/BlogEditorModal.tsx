// src/features/blog/components/BlogEditorModal.tsx
import { useEffect, useState } from "react";
import { ChevronDown, Eye, FileEdit, PenTool } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        setShowAdvanced(Boolean(initialBlog.slug));
        setSummary(initialBlog.summary || "");
        setThumbnailUrl(initialBlog.thumbnailUrl || "");
        setContent(initialBlog.content || "");
      } else {
        setTitle("");
        setSlug("");
        setAutoSlug(true);
        setShowAdvanced(false);
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

  const validate = (): { ok: boolean; finalSlug: string } => {
    const errs: Record<string, string> = {};
    const t = title.trim();
    const s = (autoSlug ? slugifyVietnamese(title) : slug).trim();
    const c = content.trim();

    if (!t) {
      errs.title = "Hãy nhập tiêu đề bài viết";
    } else if (t.length > 255) {
      errs.title = "Tiêu đề tối đa 255 ký tự";
    }

    if (!s) {
      errs.slug = "Đường dẫn bài viết chưa hợp lệ — thử đổi tiêu đề";
    } else if (s.length > 255) {
      errs.slug = "Đường dẫn tối đa 255 ký tự";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      errs.slug =
        "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang";
    }

    if (summary && summary.length > 500) {
      errs.summary = "Tóm tắt tối đa 500 ký tự";
    }

    if (thumbnailUrl && thumbnailUrl.length > 500) {
      errs.thumbnailUrl = "Link ảnh bìa tối đa 500 ký tự";
    }

    if (!c) {
      errs.content = "Hãy viết nội dung bài trước khi lưu";
    }

    setErrors(errs);
    if (!errs.slug && autoSlug) {
      setSlug(s);
    }
    if (errs.slug) {
      setShowAdvanced(true);
    }
    return { ok: Object.keys(errs).length === 0, finalSlug: s };
  };

  const handleSubmit = async () => {
    const { ok, finalSlug } = validate();
    if (!ok) return;

    try {
      if (isEditing && initialBlog) {
        const res = await updateMutation.mutateAsync({
          id: initialBlog.id,
          data: {
            title: title.trim(),
            slug: finalSlug,
            summary: summary.trim() || undefined,
            content: content.trim(),
            thumbnailUrl: thumbnailUrl.trim() || undefined,
          },
        });
        onSaved?.(res);
      } else {
        const res = await createMutation.mutateAsync({
          title: title.trim(),
          slug: finalSlug,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col border-gold/30 bg-background/95 backdrop-blur-2xl p-6 sm:p-8">
        <DialogHeader className="border-b border-gold/15 pb-4">
          <DialogTitle className="font-display text-2xl text-gradient-gold flex items-center gap-2">
            <PenTool className="h-5 w-5 text-gold" />
            {isEditing ? "Sửa bài viết" : "Viết bài mới"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            {isEditing
              ? "Sửa xong nhớ bấm Lưu. Nếu bài đang chờ duyệt hoặc bị từ chối, sau khi sửa sẽ về bản nháp để bạn gửi lại."
              : "Viết như bình thường, lưu bản nháp rồi gửi duyệt khi sẵn sàng. Không cần biết kỹ thuật."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="blog-title"
                className="text-xs font-semibold text-foreground"
              >
                Tiêu đề <span className="text-rose-400">*</span>
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
              placeholder="Ví dụ: Tarot hôm nay nói gì với bạn"
              className="border-gold/30 bg-card/40 focus:border-gold text-sm sm:text-base font-medium"
            />
            {errors.title && (
              <p className="text-xs text-rose-400">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="blog-summary"
                className="text-xs font-semibold text-foreground"
              >
                Tóm tắt ngắn
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {summary.length}/500
              </span>
            </div>
            <Textarea
              id="blog-summary"
              rows={2}
              maxLength={500}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (errors.summary)
                  setErrors((prev) => ({ ...prev, summary: "" }));
              }}
              placeholder="1–2 câu giới thiệu bài (hiện trên danh sách Blog). Có thể bỏ trống."
              className="border-gold/30 bg-card/40 focus:border-gold text-sm resize-none"
            />
            {errors.summary && (
              <p className="text-xs text-rose-400">{errors.summary}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="blog-thumbnail"
              className="text-xs font-semibold text-foreground"
            >
              Ảnh bìa
            </Label>
            <Input
              id="blog-thumbnail"
              value={thumbnailUrl}
              maxLength={500}
              onChange={(e) => {
                setThumbnailUrl(e.target.value);
                if (errors.thumbnailUrl)
                  setErrors((prev) => ({ ...prev, thumbnailUrl: "" }));
              }}
              placeholder="Dán link ảnh (bắt đầu bằng https://...) — hoặc bỏ trống"
              className="border-gold/30 bg-card/40 focus:border-gold text-sm"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mở ảnh trên trình duyệt → chuột phải → Sao chép địa chỉ ảnh → dán
              vào đây. Không có ảnh thì trang sẽ dùng họa tiết mặc định.
            </p>
            {thumbnailUrl ? (
              <div className="mt-1 relative h-28 w-full rounded-md border border-gold/20 overflow-hidden bg-muted/20">
                <img
                  src={thumbnailUrl}
                  alt="Xem trước ảnh bìa"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0.25";
                  }}
                />
              </div>
            ) : null}
            {errors.thumbnailUrl && (
              <p className="text-xs text-rose-400">{errors.thumbnailUrl}</p>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground">
                Nội dung bài <span className="text-rose-400">*</span>
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
                    <FileEdit className="h-3.5 w-3.5 mr-1" /> Viết
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
                <p className="text-[11px] text-muted-foreground">
                  Viết bình thường như Zalo/Word. Xuống dòng để tách đoạn — không
                  cần mã hay ký hiệu đặc biệt.
                </p>
                <Textarea
                  id="blog-content-input"
                  rows={14}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content)
                      setErrors((prev) => ({ ...prev, content: "" }));
                  }}
                  placeholder={
                    "Ví dụ:\n\nHôm nay lá The Moon nhắc bạn lắng nghe trực giác...\n\nBa việc nên làm:\n1. ...\n2. ...\n3. ..."
                  }
                  className="border-gold/30 bg-card/40 focus:border-gold text-sm leading-relaxed"
                />
              </div>
            ) : (
              <div className="min-h-[300px] max-h-[400px] overflow-y-auto rounded-lg border border-gold/30 bg-card/30 p-5 text-sm leading-relaxed whitespace-pre-wrap">
                {content.trim() ? (
                  content
                ) : (
                  <p className="text-muted-foreground italic text-center py-10">
                    Chưa có nội dung để xem trước
                  </p>
                )}
              </div>
            )}
            {errors.content && (
              <p className="text-xs text-rose-400">{errors.content}</p>
            )}
          </div>

          <div className="rounded-lg border border-gold/15 bg-card/20">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              <span>Tùy chọn nâng cao (đường dẫn bài viết)</span>
              <ChevronDown
                className={`h-4 w-4 transition ${showAdvanced ? "rotate-180" : ""}`}
              />
            </button>
            {showAdvanced ? (
              <div className="space-y-2 border-t border-gold/10 px-3 pb-3 pt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hệ thống tự tạo đường dẫn từ tiêu đề. Chỉ sửa nếu bạn cần link
                  cụ thể (chữ thường, không dấu).
                </p>
                <div className="flex items-center rounded-md border border-gold/30 bg-card/40 px-3 focus-within:border-gold">
                  <span className="text-xs text-muted-foreground select-none shrink-0">
                    /blog/
                  </span>
                  <input
                    id="blog-slug"
                    value={slug}
                    maxLength={255}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="tu-dong-theo-tieu-de"
                    className="w-full bg-transparent px-1 py-2 text-xs sm:text-sm text-foreground outline-none"
                  />
                </div>
                {autoSlug ? (
                  <button
                    type="button"
                    className="text-[11px] text-gold hover:underline"
                    onClick={() => setAutoSlug(false)}
                  >
                    Cho phép sửa tay
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-[11px] text-gold hover:underline"
                    onClick={() => {
                      setAutoSlug(true);
                      setSlug(slugifyVietnamese(title));
                    }}
                  >
                    Dùng lại đường dẫn tự động từ tiêu đề
                  </button>
                )}
                {errors.slug && (
                  <p className="text-xs text-rose-400">{errors.slug}</p>
                )}
              </div>
            ) : null}
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
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-gold hover:bg-gold-soft text-primary-foreground font-semibold glow-gold"
          >
            {isPending
              ? "Đang lưu..."
              : isEditing
                ? "Lưu thay đổi"
                : "Lưu bản nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
