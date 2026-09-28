// src/features/blog/blog.test.ts
import { describe, expect, it } from "vitest";
import {
  estimateReadTime,
  formatBlogDate,
  BLOG_STATUS_MAP,
  slugifyVietnamese,
} from "./utils";
import { blogKeys } from "./queries";

describe("Blog utilities", () => {
  describe("slugifyVietnamese", () => {
    it("should convert Vietnamese diacritics into URL friendly slug", () => {
      expect(slugifyVietnamese("Trăng Tròn Tháng 6: Cánh Cửa Năng Lượng")).toBe(
        "trang-tron-thang-6-canh-cua-nang-luong",
      );
      expect(slugifyVietnamese("Đọc bài Tarot 3 lá")).toBe(
        "doc-bai-tarot-3-la",
      );
      expect(slugifyVietnamese("Sao Thủy Nghịch Hành & Bí Quyết")).toBe(
        "sao-thuy-nghich-hanh-bi-quyet",
      );
    });

    it("should handle special characters and multiple spaces", () => {
      expect(slugifyVietnamese("  Bài Viết !!! @#$ Đặc Biệt --- 2026 ")).toBe(
        "bai-viet-dac-biet-2026",
      );
    });

    it("should truncate slug at 255 chars", () => {
      const longTitle = "a".repeat(300);
      expect(slugifyVietnamese(longTitle).length).toBe(255);
    });
  });

  describe("estimateReadTime", () => {
    it("should return at least 1 minute for short content", () => {
      expect(estimateReadTime("Ngắn gọn")).toBe(1);
      expect(estimateReadTime("")).toBe(1);
      expect(estimateReadTime(null)).toBe(1);
    });

    it("should calculate approx 200 words per minute", () => {
      const words500 = new Array(500).fill("từ").join(" ");
      expect(estimateReadTime(words500)).toBe(3);
    });
  });

  describe("formatBlogDate", () => {
    it("should format valid ISO string to Vietnamese date", () => {
      const iso = "2026-06-01T12:00:00Z";
      const formatted = formatBlogDate(iso);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should return empty string for null/undefined", () => {
      expect(formatBlogDate(null)).toBe("");
      expect(formatBlogDate(undefined)).toBe("");
    });
  });

  describe("BLOG_STATUS_MAP", () => {
    it("should contain definitions for all backend statuses", () => {
      expect(BLOG_STATUS_MAP.DRAFT.label).toBe("Bản nháp");
      expect(BLOG_STATUS_MAP.PENDING.label).toBe("Chờ duyệt");
      expect(BLOG_STATUS_MAP.APPROVED.label).toBe("Đã duyệt");
      expect(BLOG_STATUS_MAP.REJECTED.label).toBe("Bị từ chối");
      expect(BLOG_STATUS_MAP.PUBLISHED.label).toBe("Đã xuất bản");
    });

    it("should have correct badge styling class for each status", () => {
      expect(BLOG_STATUS_MAP.DRAFT.badgeClass).toContain("muted");
      expect(BLOG_STATUS_MAP.PENDING.badgeClass).toContain("amber");
      expect(BLOG_STATUS_MAP.APPROVED.badgeClass).toContain("emerald");
      expect(BLOG_STATUS_MAP.REJECTED.badgeClass).toContain("rose");
      expect(BLOG_STATUS_MAP.PUBLISHED.badgeClass).toContain("gold");
    });
  });

  describe("blogKeys query key factories", () => {
    it("should generate distinct query keys for different statuses", () => {
      const pendingKey = blogKeys.adminList({
        page: 0,
        size: 15,
        status: "PENDING",
      });
      const publishedKey = blogKeys.adminList({
        page: 0,
        size: 15,
        status: "PUBLISHED",
      });

      expect(pendingKey).not.toEqual(publishedKey);
      expect(pendingKey).toEqual([
        "blogs",
        "admin",
        { page: 0, size: 15, status: "PENDING" },
      ]);
    });

    it("should generate distinct query keys for different keywords", () => {
      const tarotKey = blogKeys.publicList({ page: 0, keyword: "tarot" });
      const astroKey = blogKeys.publicList({ page: 0, keyword: "astro" });

      expect(tarotKey).not.toEqual(astroKey);
      expect(tarotKey).toEqual([
        "blogs",
        "public",
        { page: 0, keyword: "tarot" },
      ]);
    });

    it("should generate proper myList keys with status and keyword", () => {
      const myDraftsKey = blogKeys.myList({
        page: 0,
        size: 10,
        status: "DRAFT",
        keyword: "bai-viet",
      });

      expect(myDraftsKey).toEqual([
        "blogs",
        "my",
        { page: 0, size: 10, status: "DRAFT", keyword: "bai-viet" },
      ]);
    });

    it("should handle undefined and empty filter parameters gracefully", () => {
      const publicDefaultKey = blogKeys.publicList();
      expect(publicDefaultKey).toEqual(["blogs", "public", {}]);

      const myDefaultKey = blogKeys.myList();
      expect(myDefaultKey).toEqual(["blogs", "my", {}]);

      const adminDefaultKey = blogKeys.adminList();
      expect(adminDefaultKey).toEqual(["blogs", "admin", {}]);
    });
  });

  describe("Pagination & Slicing calculations", () => {
    it("should calculate correct total pages for 25 items with page size 10", () => {
      const totalElements = 25;
      const pageSize = 10;
      const totalPages = Math.ceil(totalElements / pageSize);
      expect(totalPages).toBe(3);

      // Page 0 has 10 items, Page 1 has 10 items, Page 2 has 5 items
      const getPageItemCount = (page: number) => {
        const remaining = totalElements - page * pageSize;
        return Math.min(pageSize, Math.max(0, remaining));
      };

      expect(getPageItemCount(0)).toBe(10);
      expect(getPageItemCount(1)).toBe(10);
      expect(getPageItemCount(2)).toBe(5);
      expect(getPageItemCount(3)).toBe(0);
    });
  });

  describe("Blog state machine lifecycle validation", () => {
    const isActionAllowed = (
      action: "edit" | "submit" | "approve" | "reject" | "publish" | "delete_author" | "delete_admin",
      status: string,
    ): boolean => {
      switch (action) {
        case "edit":
          return ["DRAFT", "PENDING", "REJECTED"].includes(status);
        case "submit":
          return ["DRAFT", "REJECTED"].includes(status);
        case "approve":
        case "reject":
          return status === "PENDING";
        case "publish":
          return status === "APPROVED";
        case "delete_author":
          return status === "DRAFT";
        case "delete_admin":
          return true; // Admin can delete any status
        default:
          return false;
      }
    };

    it("should permit author edit on DRAFT, PENDING, and REJECTED", () => {
      expect(isActionAllowed("edit", "DRAFT")).toBe(true);
      expect(isActionAllowed("edit", "PENDING")).toBe(true);
      expect(isActionAllowed("edit", "REJECTED")).toBe(true);
      expect(isActionAllowed("edit", "APPROVED")).toBe(false);
      expect(isActionAllowed("edit", "PUBLISHED")).toBe(false);
    });

    it("should permit author submit on DRAFT and REJECTED", () => {
      expect(isActionAllowed("submit", "DRAFT")).toBe(true);
      expect(isActionAllowed("submit", "REJECTED")).toBe(true);
      expect(isActionAllowed("submit", "PENDING")).toBe(false);
      expect(isActionAllowed("submit", "PUBLISHED")).toBe(false);
    });

    it("should only permit review approve/reject on PENDING", () => {
      expect(isActionAllowed("approve", "PENDING")).toBe(true);
      expect(isActionAllowed("reject", "PENDING")).toBe(true);
      expect(isActionAllowed("approve", "DRAFT")).toBe(false);
      expect(isActionAllowed("approve", "APPROVED")).toBe(false);
    });

    it("should only permit publish on APPROVED", () => {
      expect(isActionAllowed("publish", "APPROVED")).toBe(true);
      expect(isActionAllowed("publish", "PENDING")).toBe(false);
      expect(isActionAllowed("publish", "DRAFT")).toBe(false);
      expect(isActionAllowed("publish", "PUBLISHED")).toBe(false);
    });

    it("should only permit author deletion on DRAFT", () => {
      expect(isActionAllowed("delete_author", "DRAFT")).toBe(true);
      expect(isActionAllowed("delete_author", "PENDING")).toBe(false);
      expect(isActionAllowed("delete_author", "REJECTED")).toBe(false);
      expect(isActionAllowed("delete_author", "PUBLISHED")).toBe(false);
    });
  });
});
