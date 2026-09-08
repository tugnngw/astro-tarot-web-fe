import { useState } from "react";
import { Check, Copy, Landmark, X } from "lucide-react";
import { toast } from "sonner";
import type { PaymentInstruction } from "@/api/money";
import { formatVND } from "@/lib/mock-data";

/**
 * Hướng dẫn chuyển khoản.
 *
 * Mã tham chiếu là thứ duy nhất nối khoản tiền trong sao kê với lịch hẹn, nên
 * nó được đặt to nhất và có nút chép sẵn. Gõ sai một ký tự là người trực không
 * tra ra và khoản tiền nằm chờ.
 */
export function PaymentDialog({
  instruction,
  onClose,
}: {
  instruction: PaymentInstruction;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Trình duyệt chặn clipboard (thường vì không phải HTTPS). Nói thật thay
      // vì im lặng để người dùng tưởng đã chép được.
      toast.error("Trình duyệt không cho chép tự động, bạn chép tay giúp nhé");
    }
  }

  const notConfigured = instruction.bankAccountNumber === "Chưa cấu hình";

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

        <h2 id="pay-title" className="flex items-center gap-2 font-display text-xl">
          <Landmark aria-hidden="true" className="h-5 w-5 text-gold" />
          Chuyển khoản
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Chuyển đúng số tiền và đúng nội dung bên dưới. Chúng tôi đối soát rồi
          xác nhận, thường trong vài giờ làm việc.
        </p>

        {notConfigured && (
          <p className="mt-4 rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive">
            Hệ thống chưa cấu hình tài khoản nhận tiền. Báo với quản trị viên
            trước khi chuyển khoản.
          </p>
        )}

        <dl className="mt-5 space-y-3">
          <Field label="Số tiền" value={formatVND(instruction.amount)} big />
          <Field
            label="Nội dung chuyển khoản"
            value={instruction.transferContent}
            mono
            big
            onCopy={() => copy(instruction.transferContent, "content")}
            copied={copied === "content"}
          />
          <Field label="Ngân hàng" value={instruction.bankName} />
          <Field
            label="Số tài khoản"
            value={instruction.bankAccountNumber}
            mono
            onCopy={() => copy(instruction.bankAccountNumber, "account")}
            copied={copied === "account"}
          />
          <Field label="Chủ tài khoản" value={instruction.bankAccountHolder} />
        </dl>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Ghi thiếu hoặc sai nội dung thì khoản tiền không khớp được với lịch hẹn
          của bạn và sẽ phải xử lý tay. Trạng thái thanh toán hiện ở trang Lịch
          hẹn của tôi.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold"
        >
          Tôi đã chuyển khoản
        </button>
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
        <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
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
