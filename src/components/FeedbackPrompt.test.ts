import { describe, expect, it } from "vitest";
import {
  DISMISS_KEY,
  RATING_LABELS,
  validateFeedbackInput,
} from "@/lib/feedback-utils";

describe("FeedbackPrompt logic & validation", () => {
  it("khóa lưu trạng thái ẩn 'Để sau' đúng quy ước", () => {
    expect(DISMISS_KEY).toBe("astrotarot_feedback_dismissed");
  });

  it("nhãn 5 mức sao đầy đủ và chính xác bằng tiếng Việt", () => {
    expect(RATING_LABELS[1]).toBe("Rất không hài lòng");
    expect(RATING_LABELS[2]).toBe("Chưa hài lòng");
    expect(RATING_LABELS[3]).toBe("Bình thường");
    expect(RATING_LABELS[4]).toBe("Hài lòng");
    expect(RATING_LABELS[5]).toBe("Rất hài lòng");
  });

  describe("validateFeedbackInput", () => {
    it("từ chối khi chưa chọn sao (null)", () => {
      const res = validateFeedbackInput(null, "Bài đọc rất hay");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("chọn điểm đánh giá từ 1 đến 5 sao");
    });

    it("từ chối khi số sao nhỏ hơn 1 hoặc lớn hơn 5", () => {
      expect(validateFeedbackInput(0, "").valid).toBe(false);
      expect(validateFeedbackInput(6, "").valid).toBe(false);
    });

    it("chấp nhận khi số sao từ 1 đến 5 và bình luận hợp lệ", () => {
      for (let s = 1; s <= 5; s++) {
        expect(validateFeedbackInput(s, "").valid).toBe(true);
        expect(validateFeedbackInput(s, "Góp ý ngắn").valid).toBe(true);
      }
    });

    it("từ chối khi bình luận vượt quá 2.000 ký tự", () => {
      const longComment = "a".repeat(2001);
      const res = validateFeedbackInput(5, longComment);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("vượt quá 2.000 ký tự");
    });

    it("chấp nhận bình luận chạm đúng ngưỡng 2.000 ký tự", () => {
      const maxComment = "a".repeat(2000);
      const res = validateFeedbackInput(5, maxComment);
      expect(res.valid).toBe(true);
    });
  });
});
