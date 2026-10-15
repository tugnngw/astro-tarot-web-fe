export const FEEDBACK_PAGE_SIZE = 10;

export const SOURCE_VI: Record<string, string> = {
  TAROT_AI: "Trải bài AI",
  BOOKING: "Đặt lịch Reader",
  GENERAL: "Góp ý chung",
  LANDING: "Trang chủ",
};

export const SOURCE_COLORS: Record<string, string> = {
  TAROT_AI: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  BOOKING: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  GENERAL: "bg-gold/15 text-gold border-gold/30",
  LANDING: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

export function nf(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}
