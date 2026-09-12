// Hộp thoại xác nhận dùng chung.
//
// Tách ra từ dáng của LogoutConfirm để những chỗ khác không phải rơi về
// confirm() trần của trình duyệt — nó không theo giao diện của trang, không
// dịch được, và ở một số trình duyệt còn bị chặn.
import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = hành động mất dữ liệu; nút xác nhận chuyển sang màu cảnh báo. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Escape đóng — hành vi mặc định người dùng mong đợi ở mọi hộp thoại.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in-95"
      >
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl ${
            destructive ? "bg-destructive/15" : "bg-gold/15"
          }`}
        >
          {destructive ? "⚠" : "✦"}
        </div>
        <h3 className="mt-4 font-display text-2xl text-gradient-gold">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-gold/40 py-2.5 text-sm text-gold transition hover:bg-gold/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-gold text-background hover:bg-gold/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
