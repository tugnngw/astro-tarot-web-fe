// src/features/blog/components/BlogRejectModal.tsx
import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BlogResponse } from "@/api/types";
import { useReviewBlog } from "../queries";

interface BlogRejectModalProps {
  blog: BlogResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogRejectModal({
  blog,
  open,
  onOpenChange,
}: BlogRejectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reviewMutation = useReviewBlog();

  const handleClose = () => {
    setReason("");
    setError(null);
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!blog) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(
        "Vui lòng nhập lý do từ chối bài viết để tác giả có thể chỉnh sửa.",
      );
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: blog.id,
        request: {
          action: "REJECTED",
          rejectionReason: trimmed,
        },
      });
      handleClose();
    } catch {
      // Error is handled in mutation onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] border-gold/30 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> Từ chối duyệt bài viết
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Bài viết sẽ được chuyển về trạng thái <strong>Bị từ chối</strong>.
            Tác giả sẽ nhận được lý do này để chỉnh sửa và gửi duyệt lại.
          </DialogDescription>
        </DialogHeader>

        {blog && (
          <div className="my-2 rounded-lg border border-gold/15 bg-card/40 p-3 text-xs">
            <p className="font-medium text-foreground line-clamp-1">
              {blog.title}
            </p>
            <p className="text-muted-foreground mt-0.5">
              Tác giả: {blog.author?.fullName || blog.author?.username}
            </p>
          </div>
        )}

        <div className="space-y-2 py-2">
          <Label
            htmlFor="reject-reason"
            className="text-xs font-medium text-foreground"
          >
            Lý do từ chối <span className="text-rose-400">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ví dụ: Nội dung chưa đúng định dạng, cần thêm hình ảnh minh họa, thông tin chưa chính xác..."
            className="border-gold/30 bg-card/50 text-sm focus:border-gold"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={reviewMutation.isPending}
            className="border border-gold/20 hover:bg-gold/10 text-muted-foreground"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={reviewMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {reviewMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
