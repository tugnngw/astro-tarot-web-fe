export const DISMISS_KEY = "astrotarot_feedback_dismissed";

export const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng",
};

export function validateFeedbackInput(
  rating: number | null,
  comment: string,
): { valid: boolean; error?: string } {
  if (rating == null || rating < 1 || rating > 5) {
    return {
      valid: false,
      error: "Vui lòng chọn điểm đánh giá từ 1 đến 5 sao",
    };
  }
  if (comment.length > 2000) {
    return { valid: false, error: "Góp ý không được vượt quá 2.000 ký tự" };
  }
  return { valid: true };
}
