import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink, Landmark, X } from "lucide-react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import type { PaymentInstruction } from "@/api/money";
import { formatVND } from "@/lib/mock-data";

/**
 * Hướng dẫn thanh toán: PayOS (link checkout) hoặc chuyển khoản tay.
 */
export function PaymentDialog({
  instruction,
  onClose,
}: {
  instruction: PaymentInstruction;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const isPayOs =
    Boolean(instruction.checkoutUrl) || instruction.paymentMethod === "PAYOS";

  const phaseLabel: Record<string, string> = {
    DEPOSIT: "Đặt cọc",
    REMAINING: "Thanh toán nốt",
    FULL: "Thanh toán đủ",
  };

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Trình duyệt không cho chép tự động, bạn chép tay giúp nhé");
    }
  }

  const notConfigured =
    !isPayOs && instruction.bankAccountNumber === "Chưa cấu hình";

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
        aria-labelledby="pay-title"
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
          id="pay-title"
          className="flex items-center gap-2 font-display text-xl"
        >
          <Landmark aria-hidden="true" className="h-5 w-5 text-gold" />
          {isPayOs ? "Thanh toán PayOS" : "Chuyển khoản"}
          {instruction.paymentPhase && (
            <span className="ml-auto rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] text-gold">
              {phaseLabel[instruction.paymentPhase] ?? instruction.paymentPhase}
            </span>
          )}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {instruction.paymentPhase === "DEPOSIT"
            ? "Đây là khoản đặt cọc 50%. Bạn sẽ thanh toán nốt phần còn lại trước buổi xem."
            : instruction.paymentPhase === "REMAINING"
              ? "Đây là phần còn lại của lịch hẹn. Vui lòng chuyển đủ số tiền trước hạn."
              : instruction.paymentPhase === "FULL"
                ? "Lịch hẹn dưới 12 giờ. Bạn cần thanh toán toàn bộ ngay."
                : isPayOs
                  ? "Mở PayOS để quét VietQR hoặc chuyển khoản. Hệ thống xác nhận tự động sau khi nhận tiền."
                  : "Chuyển đúng số tiền và đúng nội dung bên dưới. Chúng tôi đối soát rồi xác nhận, thường trong vài giờ làm việc."}
        </p>

        {notConfigured && (
          <p className="mt-4 rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive">
            Hệ thống chưa cấu hình tài khoản nhận tiền. Báo với quản trị viên
            trước khi chuyển khoản.
          </p>
        )}

        {/*
          Mã QR đã điền sẵn SỐ TIỀN và NỘI DUNG — quét xong là bấm xác nhận,
          không gõ gì nữa.

          Ba thứ bên dưới vẫn giữ nguyên chứ không thay bằng mã: không phải ai
          cũng quét được (ảnh chụp màn hình gửi cho người khác chuyển hộ, máy
          tính không có ứng dụng ngân hàng), và đó chính là những lần cần số
          tài khoản dạng chữ nhất.
        */}
        {!isPayOs && instruction.qrCode && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={instruction.qrCode} size={168} level="M" />
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Quét bằng ứng dụng ngân hàng — số tiền và nội dung đã điền sẵn.
            </p>
          </div>
        )}

        <dl className="mt-5 space-y-3">
          <Field label="Số tiền" value={formatVND(instruction.amount)} big />
          {!isPayOs && (
            <Field
              label="Nội dung chuyển khoản"
              value={instruction.transferContent}
              mono
              big
              onCopy={() => copy(instruction.transferContent, "content")}
              copied={copied === "content"}
            />
          )}
          {isPayOs && (
            <Field
              label="Mã đơn PayOS"
              value={instruction.referenceCode}
              mono
              onCopy={() => copy(instruction.referenceCode, "ref")}
              copied={copied === "ref"}
            />
          )}
          {!isPayOs && (
            <>
              <Field label="Ngân hàng" value={instruction.bankName} />
              <Field
                label="Số tài khoản"
                value={instruction.bankAccountNumber}
                mono
                onCopy={() => copy(instruction.bankAccountNumber, "account")}
                copied={copied === "account"}
              />
              <Field
                label="Chủ tài khoản"
                value={instruction.bankAccountHolder}
              />
            </>
          )}
        </dl>

        {instruction.checkoutUrl ? (
          <a
            href={instruction.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Thanh toán với PayOS
          </a>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            Tôi đã chuyển khoản
          </button>
        )}

        {instruction.checkoutUrl && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-full border border-gold/30 py-2 text-xs text-muted-foreground transition hover:bg-gold/10"
          >
            Đóng — trạng thái cập nhật ở trang Lịch hẹn
          </button>
        )}

        {!isPayOs && (
          <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
            Ghi thiếu hoặc sai nội dung thì khoản tiền không khớp được với lịch
            hẹn của bạn và sẽ phải xử lý tay. Trạng thái thanh toán hiện ở trang
            Lịch hẹn của tôi.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  big,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  big?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 px-3 py-2">
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        <dd
          className={`mt-0.5 break-all ${big ? "font-display text-lg text-gold" : "text-sm"} ${
            mono ? "font-mono tracking-wide" : ""
          }`}
        >
          {value}
        </dd>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Chép ${label}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
