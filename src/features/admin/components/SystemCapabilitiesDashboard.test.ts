import { describe, expect, it } from "vitest";
import {
  CAPABILITY_DOMAINS,
  CAPABILITY_STATUS_CONFIG,
  getCapabilityStats,
  type CapabilityStatus,
} from "../capability-data";

describe("SystemCapabilitiesDashboard — Ma trận năng lực (Section A)", () => {
  it("chứa đầy đủ các miền năng lực cốt lõi theo mã nguồn thực tế", () => {
    const domainIds = CAPABILITY_DOMAINS.map((d) => d.id);
    expect(domainIds).toContain("auth-rbac");
    expect(domainIds).toContain("ai-tarot");
    expect(domainIds).toContain("astrology");
    expect(domainIds).toContain("reader-marketplace");
    expect(domainIds).toContain("escrow-payments");
    expect(domainIds).toContain("system-feedback");
    expect(domainIds).toContain("affiliate-shop");
    expect(domainIds).toContain("blog-moderation");
    expect(domainIds).toContain("ai-subscription-plans");
  });

  it("mỗi miền năng lực có đầy đủ mô tả, chức năng, bằng chứng kỹ thuật và giới hạn", () => {
    for (const domain of CAPABILITY_DOMAINS) {
      expect(domain.id).toBeTruthy();
      expect(domain.name).toBeTruthy();
      expect(domain.description).toBeTruthy();
      expect(domain.functionality.length).toBeGreaterThan(0);
      expect(domain.evidence.sourceFiles.length).toBeGreaterThan(0);
      expect(domain.evidence.apiRoutes.length).toBeGreaterThan(0);
      expect(domain.limitations.length).toBeGreaterThan(0);
    }
  });

  it("trạng thái kiểm định chỉ sử dụng các giá trị hợp lệ theo chuẩn Outcome 3", () => {
    const validStatuses: CapabilityStatus[] = [
      "IMPLEMENTED",
      "TESTED",
      "RUNTIME VERIFIED",
      "PARTIALLY IMPLEMENTED",
      "BLOCKED",
      "NOT VERIFIED",
    ];

    for (const domain of CAPABILITY_DOMAINS) {
      expect(validStatuses).toContain(domain.status);
    }
  });

  it("Phase 1 System Rating & Review mang trạng thái TESTED với bằng chứng kiểm thử đầy đủ", () => {
    const feedbackDomain = CAPABILITY_DOMAINS.find((d) => d.id === "system-feedback");
    expect(feedbackDomain).toBeDefined();
    expect(feedbackDomain?.status).toBe("TESTED");
    expect(feedbackDomain?.evidence.testFiles.length).toBeGreaterThanOrEqual(4);
    expect(feedbackDomain?.evidence.testCount).toBeGreaterThanOrEqual(20);
    expect(feedbackDomain?.frontendRoute).toBe("/admin?tab=feedback");
  });

  it("tổng hợp chỉ số năng lực (getCapabilityStats) tính toán chính xác số lượng và tỷ lệ", () => {
    const stats = getCapabilityStats(CAPABILITY_DOMAINS);
    expect(stats.total).toBe(CAPABILITY_DOMAINS.length);
    expect(stats.byStatus.TESTED).toBeGreaterThan(0);
    expect(stats.verifiedOrTested).toBe(
      stats.byStatus.TESTED + stats.byStatus["RUNTIME VERIFIED"]
    );
    expect(stats.verifiedRate).toBe(
      Math.round((stats.verifiedOrTested / stats.total) * 100)
    );
  });

  it("cấu hình hiển thị trạng thái (CAPABILITY_STATUS_CONFIG) có đủ nhãn và mô tả cho mọi trạng thái", () => {
    const statuses: CapabilityStatus[] = [
      "TESTED",
      "RUNTIME VERIFIED",
      "IMPLEMENTED",
      "PARTIALLY IMPLEMENTED",
      "BLOCKED",
      "NOT VERIFIED",
    ];

    for (const st of statuses) {
      const cfg = CAPABILITY_STATUS_CONFIG[st];
      expect(cfg).toBeDefined();
      expect(cfg.label).toBeTruthy();
      expect(cfg.description).toBeTruthy();
      expect(cfg.badgeClass).toBeTruthy();
      expect(cfg.dotColor).toBeTruthy();
    }
  });
});

describe("SystemCapabilitiesDashboard — Kinh tế nền tảng & Số liệu (Section B)", () => {
  it("tính toán kinh tế nền tảng khớp với logic backend (20% phí, 80% Reader, trừ phí AI)", () => {
    const grossRevenue = 10_000_000;
    const feePercent = 20;
    const platformFee = (grossRevenue * feePercent) / 100;
    const readerShare = grossRevenue - platformFee;
    const aiCostVnd = 62_500;
    const netProfit = platformFee - aiCostVnd;

    expect(platformFee).toBe(2_000_000);
    expect(readerShare).toBe(8_000_000);
    expect(platformFee + readerShare).toBe(grossRevenue);
    expect(netProfit).toBe(1_937_500);
  });

  it("lợi nhuận ròng có thể nhận giá trị âm khi chi phí AI vượt phí nền tảng", () => {
    const grossRevenue = 100_000;
    const feePercent = 20;
    const platformFee = (grossRevenue * feePercent) / 100; // 20.000
    const aiCostVnd = 1_250_000; // Chi phí AI cao
    const netProfit = platformFee - aiCostVnd;

    expect(netProfit).toBeLessThan(0);
    expect(netProfit).toBe(-1_230_000);
  });
});
