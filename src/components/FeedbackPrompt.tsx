import { useEffect, useState } from "react";
import { Edit3, Loader2, MessageSquareHeart, Star, X } from "lucide-react";
import { toast } from "sonner";
import { LopPhu } from "@/components/GocNoi";
import {
  EXTERNAL_FEEDBACK_FORM_URL,
  getMyFeedbackStatus,
  submitFeedback,
  type SubmitFeedbackPayload,
  type UserFeedbackResponse,
} from "@/api/feedback";
import { useAuth } from "@/lib/auth-context";
import { readStoredUtm } from "@/lib/utm";
import { trackCta } from "@/lib/track";
import {
  DISMISS_KEY,
  RATING_LABELS,
  validateFeedbackInput,
} from "@/lib/feedback-utils";

/**
 * Hộp thoại thu thập và chỉnh sửa đánh giá & góp ý hệ thống (Task A).
 * - Bắt buộc: 1–5 sao với tương tác hover/focus/selected.
 * - Tuỳ chọn: Bình luận tối đa 2.000 ký tự kèm bộ đếm thời gian thực.
 * - Tuỳ chọn: Điểm NPS (0–10). Nếu bỏ qua, hệ thống tự động gán nps = rating * 2.
 * - Khách vãng lai gửi phản hồi độc lập không gán ID giả mạo.
 * - Thành viên đã đăng nhập có thể xem và sửa lại đánh giá cũ mà không làm tăng tổng số bản ghi.
 */
export function FeedbackPrompt({
  defaultSource = "GENERAL",
}: {
  defaultSource?: SubmitFeedbackPayload["source"];
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [showNps, setShowNps] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [myFeedback, setMyFeedback] = useState<UserFeedbackResponse | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setHidden(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setAlreadySubmitted(false);
      setMyFeedback(null);
      return;
    }
    void getMyFeedbackStatus()
      .then((status) => {
        setAlreadySubmitted(status.submitted);
        if (status.myFeedback) {
          setMyFeedback(status.myFeedback);
        }
      })
      .catch(() => {
        /* guest / BE offline / mạng lỗi */
      });
  }, [user]);

  function handleOpen() {
    if (myFeedback) {
      setRating(myFeedback.rating);
      setComment(myFeedback.comment ?? "");
      setNps(myFeedback.nps ?? null);
      if (myFeedback.nps != null && myFeedback.nps !== myFeedback.rating * 2) {
        setShowNps(true);
      }
    } else {
      setRating(null);
      setComment("");
      setNps(null);
    }
    setOpen(true);
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
    setOpen(false);
  }

  async function handleSend() {
    const check = validateFeedbackInput(rating, comment);
    if (!check.valid || rating == null) {
      toast.error(check.error);
      return;
    }

    setBusy(true);
    const utm = readStoredUtm();
    try {
      const saved = await submitFeedback({
        source: defaultSource,
        rating,
        nps,
        comment: comment.trim() || null,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
      });

      trackCta("gui_gop_y", { nguon_gop_y: defaultSource, sao: rating ?? 0 });

      toast.success(
        alreadySubmitted
          ? "Đã cập nhật đánh giá của bạn thành công"
          : "Cảm ơn bạn — đánh giá đã được ghi nhận",
      );

      setAlreadySubmitted(true);
      if (saved) {
        setMyFeedback(saved);
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không gửi được đánh giá");
    } finally {
      setBusy(false);
    }
  }

  // Ẩn nếu khách vãng lai đã chọn "Để sau"
  if (hidden && !user) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-card/90 px-3.5 py-2 text-xs font-medium text-gold shadow-lg backdrop-blur transition hover:bg-gold/15 focus:outline-none focus:ring-2 focus:ring-gold/50"
        aria-label={
          alreadySubmitted
            ? "Xem và chỉnh sửa đánh giá của bạn"
            : "Gửi đánh giá & góp ý"
        }
      >
        {alreadySubmitted ? (
          <>
            <Edit3 className="h-4 w-4 text-gold" aria-hidden />
            <span>Đánh giá của bạn</span>
          </>
        ) : (
          <>
            <MessageSquareHeart className="h-4 w-4 text-gold" aria-hidden />
            <span>Góp ý</span>
          </>
        )}
      </button>

      {open && (
        <LopPhu>
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-xs sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
          >
            <div className="panel-black w-full max-w-lg rounded-2xl border border-gold/30 bg-card p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="feedback-dialog-title"
                    className="font-display text-xl text-foreground"
                  >
                    {alreadySubmitted
                      ? "Chỉnh sửa đánh giá của bạn"
                      : "Đánh giá trải nghiệm ASTROTAROT"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alreadySubmitted
                      ? "Cập nhật đánh giá sẽ lưu lại ý kiến mới nhất của bạn."
                      : "Chia sẻ cảm nhận giúp chúng tôi nâng cao chất lượng dịch vụ."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-gold/10 hover:text-foreground"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 1–5 Star Rating (Bắt buộc) */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Mức độ hài lòng <span className="text-rose-400">*</span>
                  </label>
                  {(hoverRating || rating) && (
                    <span className="text-xs font-semibold text-gold">
                      {RATING_LABELS[hoverRating ?? rating!]}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating ?? 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onFocus={() => setHoverRating(star)}
                        onBlur={() => setHoverRating(null)}
                        className="rounded-lg p-1.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/60"
                        aria-label={`${star} sao — ${RATING_LABELS[star]}${
                          rating === star ? " (đã chọn)" : ""
                        }`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            active
                              ? "fill-gold text-gold drop-shadow-[0_0_6px_rgba(212,168,75,0.45)]"
                              : "text-muted-foreground/35 hover:text-gold/60"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea bình luận (Tuỳ chọn, tối đa 2000 ký tự) */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="feedback-comment-textarea"
                    className="font-medium text-foreground"
                  >
                    Ý kiến đóng góp (tuỳ chọn)
                  </label>
                  <span
                    className={`text-xs ${
                      comment.length > 2000
                        ? "font-semibold text-rose-500"
                        : comment.length >= 1800
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {comment.length} / 2.000 ký tự
                  </span>
                </div>
                <textarea
                  id="feedback-comment-textarea"
                  value={comment}
                  maxLength={2000}
                  onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gold/30 bg-muted/20 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Điều gì bạn thích hoặc cần chúng tôi cải thiện hơn? (Tối đa 2.000 ký tự)"
                />
              </div>

              {/* NPS Score (Tuỳ chọn) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowNps((v) => !v)}
                  className="text-xs text-muted-foreground transition hover:text-gold"
                >
                  {showNps
                    ? "− Ẩn câu hỏi giới thiệu (NPS)"
                    : "+ Đánh giá mức độ sẵn sàng giới thiệu cho bạn bè (NPS — tuỳ chọn)"}
                </button>
                {showNps && (
                  <div className="mt-2 rounded-xl border border-gold/20 bg-card/50 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Bạn có sẵn sàng giới thiệu ASTROTAROT cho bạn bè? (0 =
                      không bao giờ, 10 = chắc chắn)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 11 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNps(nps === i ? null : i)}
                          className={`h-7 w-7 rounded-lg text-xs font-medium transition ${
                            nps === i
                              ? "bg-gold text-background shadow-xs font-bold"
                              : "border border-gold/30 text-foreground hover:bg-gold/15"
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer controls */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-4">
                {!alreadySubmitted ? (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground transition hover:text-foreground hover:underline"
                  >
                    Để sau
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Tài khoản: {user?.username ?? user?.email}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {EXTERNAL_FEEDBACK_FORM_URL &&
                    !EXTERNAL_FEEDBACK_FORM_URL.endsWith("forms.gle/") && (
                      <a
                        href={EXTERNAL_FEEDBACK_FORM_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-gold/50 px-3.5 py-1.5 text-xs text-gold transition hover:bg-gold/10"
                      >
                        Form Google
                      </a>
                    )}
                  <button
                    type="button"
                    disabled={busy || rating == null}
                    onClick={() => void handleSend()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-background shadow-sm transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang lưu…</span>
                      </>
                    ) : alreadySubmitted ? (
                      "Cập nhật góp ý"
                    ) : (
                      "Gửi đánh giá"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </LopPhu>
      )}
    </>
  );
}
