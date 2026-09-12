import { useEffect, useState } from "react";
import { MessageSquareHeart, X } from "lucide-react";
import { toast } from "sonner";
import {
  EXTERNAL_FEEDBACK_FORM_URL,
  getMyFeedbackStatus,
  submitFeedback,
  type SubmitFeedbackPayload,
} from "@/api/feedback";
import { useAuth } from "@/lib/auth-context";
import { readStoredUtm } from "@/lib/utm";

const DISMISS_KEY = "astrotarot_feedback_dismissed";

/**
 * Khảo sát ngắn (NPS) — EXE201 OC3 cần ≥20 phản hồi.
 * Hiện nút nổi; mở form in-app + link Google Form dự phòng.
 */
export function FeedbackPrompt({
  defaultSource = "GENERAL",
}: {
  defaultSource?: SubmitFeedbackPayload["source"];
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [nps, setNps] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [already, setAlready] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") setHidden(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    void getMyFeedbackStatus()
      .then((s) => {
        setAlready(s.submitted);
        setTotal(s.total);
        if (s.submitted) setHidden(true);
      })
      .catch(() => {
        /* guest / BE cũ */
      });
  }, [user]);

  if (hidden || already) return null;

  async function send() {
    if (nps == null) {
      toast.error("Chọn điểm NPS (0–10) trước");
      return;
    }
    setBusy(true);
    const utm = readStoredUtm();
    try {
      await submitFeedback({
        source: defaultSource,
        nps,
        rating,
        comment: comment.trim() || null,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
      });
      toast.success("Cảm ơn bạn — phản hồi đã được ghi nhận");
      setAlready(true);
      setOpen(false);
      setHidden(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không gửi được phản hồi");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/90 px-3 py-2 text-xs text-gold shadow-lg backdrop-blur transition hover:bg-gold/10 sm:bottom-6"
        aria-label="Gửi phản hồi"
      >
        <MessageSquareHeart className="h-4 w-4" aria-hidden />
        Góp ý
        {total > 0 ? (
          <span className="text-muted-foreground">({total}/20)</span>
        ) : null}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <div className="panel-black w-full max-w-md rounded-2xl border border-gold/30 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="font-display text-lg">
                  ASTROTAROT có giúp bạn không?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Khảo sát ngắn cho đồ án EXE201 — mục tiêu ≥20 phản hồi thật.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-mystic/20"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm">
              Bạn có sẵn sàng giới thiệu ASTROTAROT cho bạn bè? (0 = không, 10 =
              chắc chắn)
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNps(i)}
                  className={`h-8 w-8 rounded-full text-xs transition ${
                    nps === i
                      ? "bg-gold font-semibold text-background"
                      : "border border-gold/30 text-foreground hover:bg-gold/10"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm">Đánh giá trải nghiệm (tuỳ chọn)</p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`h-8 w-8 rounded-full text-xs transition ${
                    rating === i
                      ? "bg-gold font-semibold text-background"
                      : "border border-gold/30 hover:bg-gold/10"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm" htmlFor="feedback-comment">
              Góp ý thêm (tuỳ chọn)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-mystic/40 bg-mystic/10 px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
              placeholder="Điều gì nên cải thiện?"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Để sau
              </button>
              <div className="flex gap-2">
                {EXTERNAL_FEEDBACK_FORM_URL &&
                  !EXTERNAL_FEEDBACK_FORM_URL.endsWith("forms.gle/") && (
                    <a
                      href={EXTERNAL_FEEDBACK_FORM_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
                    >
                      Form Google
                    </a>
                  )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send()}
                  className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
                >
                  {busy ? "Đang gửi…" : "Gửi phản hồi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
