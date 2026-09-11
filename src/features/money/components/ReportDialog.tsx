import { useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import { REPORT_TYPES } from "@/api/money";
import { useCreateReport } from "@/features/money/queries";

/**
 * Báo cáo một buổi xem có vấn đề.
 *
 * Nói rõ với người báo cáo rằng danh tính của họ không lộ ra — đó là điều
 * khiến người ta dám bấm nút này, nhất là khi họ còn phải gặp lại Reader đó.
 */
export function ReportDialog({
  reportedUserId,
  reportedName,
  bookingId,
  onClose,
}: {
  reportedUserId: string;
  reportedName: string;
  bookingId?: string;
  onClose: () => void;
}) {
  const create = useCreateReport();
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        reportedUserId,
        reportType,
        description: description.trim() || undefined,
        bookingId,
      });
      toast.success("Đã ghi nhận. Chúng tôi sẽ xem xét và báo lại cho bạn.");
      onClose();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Không gửi được báo cáo");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="panel-black relative w-full max-w-md rounded-2xl border border-gold/25 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <h2
          id="report-title"
          className="flex items-center gap-2 font-display text-xl"
        >
          <Flag aria-hidden="true" className="h-5 w-5 text-destructive" />
          Báo cáo {reportedName}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Người bị báo cáo{" "}
          <strong className="text-foreground">không biết ai đã báo</strong>. Chỉ
          đội ngũ xử lý đọc được nội dung này, và bạn sẽ nhận thông báo khi có
          kết luận.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-xs text-muted-foreground">
              Chuyện gì đã xảy ra?
            </legend>
            <div className="mt-2 space-y-1.5">
              {REPORT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={t.value}
                    checked={reportType === t.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="h-3.5 w-3.5 accent-[var(--gold)]"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs text-muted-foreground">
              Mô tả thêm (không bắt buộc)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="Càng cụ thể thì càng xử lý nhanh: thời điểm, nội dung trao đổi..."
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-mystic/50 px-4 py-2 text-sm text-foreground/80 transition hover:border-gold/50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground transition disabled:opacity-40"
            >
              {create.isPending ? "Đang gửi…" : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
