// Khối "không tải được" dùng chung cho mọi danh sách.
//
// Trước đây mỗi trang tự dựng lại một khối gần giống nhau và in thẳng
// `error.message` ra màn hình. Khi backend trả về một trang HTML thay vì JSON —
// chuyện xảy ra mỗi lần máy chủ trên gói free của Render vừa ngủ dậy — câu hiện
// ra đúng nguyên văn là "Invalid JSON": vừa không nói được chuyện gì đang xảy
// ra, vừa không gợi ý rằng chờ một lát là được.
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ApiError } from "@/api/client";

/**
 * Dịch lỗi kỹ thuật sang câu người dùng đọc được.
 *
 * Nhận cả `unknown` vì đây là kiểu React Query trả về.
 */
export function thongDiepLoi(
  error: unknown,
  macDinh = "Không tải được dữ liệu.",
): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return error.code === "TIMEOUT"
          ? "Máy chủ phản hồi quá chậm. Bấm thử lại giúp tôi nhé."
          : "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
      case 401:
        return "Phiên đăng nhập đã hết hạn. Đăng nhập lại rồi thử lại.";
      case 403:
        return "Tài khoản của bạn không có quyền xem mục này.";
      case 404:
        return "Không tìm thấy dữ liệu cho mục này.";
      case 429:
        return "Bạn thao tác hơi nhanh. Chờ vài giây rồi thử lại.";
      default:
        if (error.status >= 500) {
          return "Máy chủ đang bận hoặc vừa khởi động lại. Chờ khoảng một phút rồi thử lại.";
        }
        return error.message || macDinh;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return macDinh;
}

export function ListError({
  error,
  onRetry,
  title,
  className = "",
}: {
  error: unknown;
  onRetry: () => void;
  /** Tiêu đề riêng của trang, ví dụ "Không tải được danh sách Reader". */
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center py-12 text-center ${className}`}
    >
      <AlertCircle className="h-8 w-8 text-destructive/70" />
      {title && <h2 className="mt-3 font-display text-lg">{title}</h2>}
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {thongDiepLoi(error)}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full border border-gold/50 px-5 py-1.5 text-sm text-gold transition hover:bg-gold/10"
      >
        Thử lại
      </button>
    </div>
  );
}

/**
 * Bật `true` khi một lần tải kéo dài bất thường.
 *
 * Máy chủ ngủ dậy mất khoảng một phút. Trong ngần ấy thời gian khung xương xám
 * cứ nhấp nháy mà không nói gì, nên người dùng tưởng trang hỏng và bỏ đi trước
 * khi dữ liệu kịp về. Câu nhắc nhỏ dưới đây chỉ là một câu, nhưng nó biến
 * "trang chết" thành "trang đang chờ".
 */
export function useTaiLau(dangTai: boolean, nguong = 4_000) {
  const [lau, setLau] = useState(false);
  useEffect(() => {
    if (!dangTai) {
      setLau(false);
      return;
    }
    const t = setTimeout(() => setLau(true), nguong);
    return () => clearTimeout(t);
  }, [dangTai, nguong]);
  return lau;
}

/** Câu nhắc hiện dưới khung xương khi tải lâu. */
export function SlowHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Máy chủ vừa khởi động lại nên lần tải đầu hơi lâu. Đang chờ…
    </p>
  );
}
