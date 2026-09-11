import { useState } from "react";
import {
  CalendarX,
  Check,
  Flag,
  Landmark,
  NotebookPen,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BOOKING_STATUS_LABEL,
  type Booking,
  type BookingStatus,
} from "@/api/booking";
import {
  useCancelBooking,
  useCompleteBooking,
  useConfirmBooking,
  useReviewBooking,
  useSaveReaderNote,
} from "@/features/booking/queries";
import { formatVND } from "@/lib/mock-data";
import { PaymentDialog } from "@/features/money/components/PaymentDialog";
import { ReportDialog } from "@/features/money/components/ReportDialog";
import { useCreatePaymentIntent } from "@/features/money/queries";
import type { PaymentInstruction } from "@/api/money";

import {
  ListError,
  useTaiLau,
  SlowHint,
  thongDiepLoi,
} from "@/components/ListError";
const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "border-amber-400/40 text-amber-300",
  CONFIRMED: "border-sky-400/40 text-sky-300",
  COMPLETED: "border-emerald-400/40 text-emerald-300",
  CANCELLED: "border-destructive/40 text-destructive",
};

/**
 * Danh sách lịch hẹn, dùng chung cho cả khách và Reader.
 *
 * `side` quyết định hiện tên bên nào và bật nút nào. Hai màn hình đó khác nhau
 * đúng ở hai điểm ấy, tách thành hai component sẽ phải sửa song song mỗi lần
 * thêm một trạng thái.
 */
export function BookingList({
  bookings,
  side,
  isPending,
  isError,
  error,
  onRetry,
}: {
  bookings: Booking[];
  side: "customer" | "reader";
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  const confirm = useConfirmBooking();
  const complete = useCompleteBooking();
  const cancel = useCancelBooking();
  const review = useReviewBooking();

  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<PaymentInstruction | null>(
    null,
  );
  const [reporting, setReporting] = useState<Booking | null>(null);
  const pay = useCreatePaymentIntent();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const busy =
    confirm.isPending ||
    complete.isPending ||
    cancel.isPending ||
    review.isPending ||
    pay.isPending;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác không thành công");
      return false;
    }
  }

  if (isError) {
    return (
      <ListError
        error={error}
        onRetry={onRetry}
        title="Không tải được lịch hẹn"
        className="glass rounded-2xl px-6 py-12"
      />
    );
  }

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="glass h-32 animate-pulse rounded-2xl"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="glass flex flex-col items-center rounded-2xl px-6 py-14 text-center">
        <CalendarX aria-hidden="true" className="h-9 w-9 text-gold/50" />
        <h3 className="mt-3 font-display text-lg">Chưa có lịch hẹn nào</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {side === "customer"
            ? "Chọn một Reader và khung giờ phù hợp để bắt đầu buổi xem đầu tiên."
            : "Khi có khách đặt lịch với bạn, lịch hẹn sẽ xuất hiện ở đây."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const other = side === "customer" ? b.readerName : b.customerName;
        const avatar = side === "customer" ? b.readerAvatar : b.customerAvatar;
        return (
          <article key={b.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/30"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mystic/20 font-display text-gold"
                  >
                    {other.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg">{other}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatRange(b.startTime, b.endTime)} · {b.durationMinutes}{" "}
                    phút
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_CLASS[b.status]}`}
                >
                  {BOOKING_STATUS_LABEL[b.status]}
                </span>
                <span className="font-display text-lg text-gold">
                  {formatVND(b.totalAmount)}
                </span>
              </div>
            </div>

            {b.cancelReason && (
              <p className="mt-3 rounded-lg border border-destructive/25 px-3 py-2 text-xs text-muted-foreground">
                <span className="text-destructive">Lý do huỷ:</span>{" "}
                {b.cancelReason}
              </p>
            )}

            {/* Thao tác theo trạng thái và theo phía */}
            <div className="mt-4 flex flex-wrap gap-2">
              {side === "reader" && b.status === "PENDING" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() => confirm.mutateAsync(b.id), "Đã nhận lịch")
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-40"
                >
                  <Check aria-hidden="true" className="h-3.5 w-3.5" /> Nhận lịch
                </button>
              )}

              {side === "reader" && b.status === "CONFIRMED" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => complete.mutateAsync(b.id),
                      "Đã hoàn tất buổi xem",
                    )
                  }
                  className="rounded-full border border-gold/50 px-3.5 py-1.5 text-xs text-gold transition hover:bg-gold/10 disabled:opacity-40"
                >
                  Đánh dấu hoàn tất
                </button>
              )}

              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setCancelling(cancelling === b.id ? null : b.id);
                    setReason("");
                  }}
                  aria-expanded={cancelling === b.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" /> Huỷ lịch
                </button>
              )}

              {side === "customer" &&
                b.paymentStatus === "UNPAID" &&
                b.status !== "CANCELLED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        setInstruction(await pay.mutateAsync(b.id));
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Không tạo được lệnh thanh toán",
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-medium text-primary-foreground glow-gold transition disabled:opacity-40"
                  >
                    <Landmark aria-hidden="true" className="h-3.5 w-3.5" />{" "}
                    Thanh toán
                  </button>
                )}

              {side === "customer" && b.paymentStatus === "PAID" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" /> Đã thanh
                  toán
                </span>
              )}

              {side === "customer" && b.status === "COMPLETED" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setReporting(b)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3.5 py-1.5 text-xs text-destructive/80 transition hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Flag aria-hidden="true" className="h-3.5 w-3.5" /> Báo cáo
                </button>
              )}

              {side === "customer" &&
                b.status === "COMPLETED" &&
                !b.reviewed && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setReviewing(reviewing === b.id ? null : b.id);
                      setRating(5);
                      setComment("");
                    }}
                    aria-expanded={reviewing === b.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition disabled:opacity-40"
                  >
                    <Star aria-hidden="true" className="h-3.5 w-3.5" /> Đánh giá
                  </button>
                )}

              {b.status === "COMPLETED" && b.reviewed && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Star aria-hidden="true" className="h-3.5 w-3.5 text-gold" />{" "}
                  Đã đánh giá
                </span>
              )}
            </div>

            {cancelling === b.id && (
              <div className="mt-3 rounded-xl border border-destructive/25 p-3">
                <label
                  htmlFor={`reason-${b.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Lý do huỷ — bên kia sẽ đọc được
                </label>
                <textarea
                  id={`reason-${b.id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
                  placeholder="Ví dụ: mình có việc đột xuất..."
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelling(null)}
                    className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
                  >
                    Giữ lịch
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      const ok = await run(
                        () =>
                          cancel.mutateAsync({
                            id: b.id,
                            reason: reason.trim() || undefined,
                          }),
                        "Đã huỷ lịch hẹn",
                      );
                      if (ok) setCancelling(null);
                    }}
                    className="rounded-full bg-destructive px-3.5 py-1.5 text-xs text-destructive-foreground disabled:opacity-40"
                  >
                    Xác nhận huỷ
                  </button>
                </div>
              </div>
            )}

            {reviewing === b.id && (
              <div className="mt-3 rounded-xl border border-gold/25 p-3">
                <fieldset>
                  <legend className="text-xs text-muted-foreground">
                    Bạn chấm mấy sao?
                  </legend>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} sao`}
                        aria-pressed={rating === n}
                        className="p-0.5"
                      >
                        <Star
                          aria-hidden="true"
                          className={`h-6 w-6 transition ${
                            n <= rating
                              ? "fill-gold text-gold"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  aria-label="Nhận xét"
                  className="mt-3 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
                  placeholder="Điều gì khiến buổi xem đáng nhớ? (không bắt buộc)"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewing(null)}
                    className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
                  >
                    Để sau
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      const ok = await run(
                        () =>
                          review.mutateAsync({
                            id: b.id,
                            rating,
                            comment: comment.trim() || undefined,
                          }),
                        "Cảm ơn bạn đã đánh giá",
                      );
                      if (ok) setReviewing(null);
                    }}
                    className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            )}
            <GhiChuBuoiXem booking={b} side={side} />
          </article>
        );
      })}

      {instruction && (
        <PaymentDialog
          instruction={instruction}
          onClose={() => setInstruction(null)}
        />
      )}

      {reporting && (
        <ReportDialog
          reportedUserId={
            side === "customer" ? reporting.readerUserId : reporting.customerId
          }
          reportedName={
            side === "customer" ? reporting.readerName : reporting.customerName
          }
          bookingId={reporting.id}
          onClose={() => setReporting(null)}
        />
      )}
    </div>
  );
}

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const DAY_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime())) return "—";
  return `${DAY_FORMAT.format(start)}, ${TIME_FORMAT.format(start)}–${TIME_FORMAT.format(end)}`;
}

/**
 * Ghi chú buổi xem.
 *
 * <p>Reader viết, khách đọc. Trước khi có nó, một buổi xem đã trả tiền không
 * để lại gì trong hệ thống ngoài dòng trạng thái COMPLETED: khách không có gì
 * để đọc lại sau một tuần, Reader không có gì để nhớ mình đã nói gì với ai.
 * Với đề tài Tarot thì đó chính là phần sản phẩm bị thiếu — lịch sử trải bài
 * chỉ lưu phần AI, tức phần miễn phí.
 */
function GhiChuBuoiXem({
  booking: b,
  side,
}: {
  booking: Booking;
  side: "customer" | "reader";
}) {
  const luu = useSaveReaderNote();
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState(b.readerNote ?? "");

  // Chỉ ghi được sau giờ hẹn: ghi chú là bản tường thuật một buổi đã diễn ra.
  // Backend chặn lần nữa, đây chỉ để không bày ra một cái nút chắc chắn lỗi.
  const daQuaGio = new Date(b.startTime).getTime() < Date.now();
  const readerGhiDuoc =
    side === "reader" && daQuaGio && b.status !== "CANCELLED";

  if (!b.readerNote && !readerGhiDuoc) return null;

  if (side === "customer") {
    return (
      <div className="mt-3 rounded-xl border border-gold/25 bg-gold/5 p-4">
        <p className="flex items-center gap-1.5 text-xs text-gold">
          <NotebookPen aria-hidden="true" className="h-3.5 w-3.5" />
          Ghi chú từ {b.readerName}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {b.readerNote}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!mo ? (
        <button
          type="button"
          onClick={() => {
            setNhap(b.readerNote ?? "");
            setMo(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs text-gold transition hover:bg-gold/10"
        >
          <NotebookPen aria-hidden="true" className="h-3.5 w-3.5" />
          {b.readerNote ? "Sửa ghi chú buổi xem" : "Viết ghi chú buổi xem"}
        </button>
      ) : (
        <div className="rounded-xl border border-gold/25 p-3">
          <label
            htmlFor={`note-${b.id}`}
            className="text-xs text-muted-foreground"
          >
            Khách sẽ đọc được câu này, nên viết cho họ — lá bài nào, ý chính,
            điều nên để ý tới.
          </label>
          <textarea
            id={`note-${b.id}`}
            value={nhap}
            onChange={(e) => setNhap(e.target.value)}
            rows={5}
            maxLength={4000}
            className="mt-2 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm leading-relaxed outline-none focus:border-gold"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {nhap.length}/4000
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMo(false)}
                className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
              >
                Để sau
              </button>
              <button
                type="button"
                disabled={luu.isPending}
                onClick={async () => {
                  try {
                    await luu.mutateAsync({ id: b.id, note: nhap.trim() });
                    toast.success(
                      nhap.trim() ? "Đã lưu ghi chú" : "Đã xoá ghi chú",
                    );
                    setMo(false);
                  } catch (e) {
                    toast.error(thongDiepLoi(e, "Không lưu được ghi chú"));
                  }
                }}
                className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {b.readerNote && !mo && (
        <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {b.readerNote}
        </p>
      )}
    </div>
  );
}
