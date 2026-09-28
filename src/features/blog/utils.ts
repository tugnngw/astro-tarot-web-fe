// src/features/blog/utils.ts
import type { BlogStatus } from "@/api/types";

export const BLOG_STATUS_MAP: Record<
  BlogStatus,
  { label: string; badgeClass: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    badgeClass: "border-muted-foreground/40 text-muted-foreground bg-muted/20",
  },
  PENDING: {
    label: "Chờ duyệt",
    badgeClass: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  },
  APPROVED: {
    label: "Đã duyệt",
    badgeClass: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  },
  REJECTED: {
    label: "Bị từ chối",
    badgeClass: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    badgeClass: "border-gold/50 text-gold bg-gold/10",
  },
};

export function formatBlogDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function estimateReadTime(content?: string | null): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugifyVietnamese(str: string): string {
  if (!str) return "";
  let slug = str.toLowerCase();
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  slug = slug.replace(/[ìíịỉĩ]/g, "i");
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, "u");
  slug = slug.replace(/[ỳýỵỷỹ]/g, "y");
  slug = slug.replace(/[đ]/g, "d");
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/[\s-]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  return slug.slice(0, 255);
}
