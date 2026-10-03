import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { walletApi, type TopupInstruction } from "@/api/wallet";

interface TopupModalProps {
  open: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function TopupModal({
  open,
  onClose,
  defaultAmount = 50000,
  onSuccess,
}: TopupModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customInput, setCustomInput] = useState<string>(defaultAmount.toString());
  const [instruction, setInstruction] = useState<TopupInstruction | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (defaultAmount) {
      setAmount(defaultAmount);
      setCustomInput(defaultAmount.toString());
    }
    if (!open) {
      setInstruction(null);
    }
  }, [defaultAmount, open]);

  const topupMutation = useMutation({
    mutationFn: (amt: number) => walletApi.createTopup(amt),
    onSuccess: (data) => {
      setInstruction(data);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Không thể tạo liên kết nạp tiền PayOS");
    },
  });

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomInput(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000 ₫");
      return;
    }
    topupMutation.mutate(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
      toast.success("Đã sao chép vào bộ nhớ tạm");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleCheckCompleted = () => {
    void queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
    toast.success("Hệ thống đang cập nhật số dư sau khi nhận thông báo từ ngân hàng");
    onSuccess?.();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-gold/25 sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gold" />
            Nạp tiền vào Ví ASTROTAROT
          </DialogTitle>
        </DialogHeader>

        {!instruction ? (
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <p className="text-xs text-muted-foreground">
              Nạp tiền nhanh chóng qua VietQR PayOS. Số dư ví dùng để thanh toán các gói AI và đặt lịch với Reader.
            </p>

            {/* Quick preset amounts */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Chọn nhanh số tiền nạp:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((val) => {
                  const active = amount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectPreset(val)}
                      className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                        active
                          ? "border-gold bg-gold/20 text-gold shadow-sm"
                          : "border-gold/20 bg-card/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                      }`}
                    >
                      {formatVND(val)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Hoặc nhập số tiền tùy chọn (Tối thiểu 10.000 ₫):
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount > 0 ? amount.toLocaleString("vi-VN") : customInput}
                  onChange={handleCustomChange}
                  className="w-full rounded-xl border border-gold/30 bg-background/60 px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Ví dụ: 100.000"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                  ₫
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span>
                Sau khi thanh toán qua mã VietQR, hệ thống sẽ tự động cập nhật số dư vào ví của bạn trong vòng vài giây.
              </span>
            </div>

            <button
              type="submit"
              disabled={topupMutation.isPending || amount < 10000}
              className="w-full rounded-full bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-lg glow-gold transition hover:opacity-95 disabled:opacity-50"
            >
              {topupMutation.isPending ? "Đang tạo mã VietQR..." : "Tiếp tục quét mã VietQR"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-gold/40">
              {instruction.qrCode ? (
                <QRCodeSVG value={instruction.qrCode} size={190} level="M" />
              ) : (
                <QrCode className="h-40 w-40 text-muted-foreground/40" />
              )}
              <p className="mt-2 text-center text-[11px] text-muted-foreground font-sans">
                Quét mã VietQR bằng app ngân hàng bất kỳ để hoàn tất nạp tiền
              </p>
            </div>

            <div className="rounded-xl border border-gold/25 bg-card/60 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gold/10">
                <span className="text-muted-foreground">Số tiền cần chuyển:</span>
                <span className="font-bold text-gradient-gold text-sm">
                  {formatVND(instruction.amount)}
                </span>
              </div>

              {instruction.transferContent && (
                <div className="flex justify-between items-center py-1 border-b border-gold/10">
                  <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground">
                      {instruction.transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(instruction.transferContent!, "content")
                      }
                      className="p-1 hover:text-gold transition text-muted-foreground"
                    >
                      {copiedField === "content" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {instruction.bankAccountNumber && (
                <div className="flex justify-between items-center py-1 border-b border-gold/10">
                  <span className="text-muted-foreground">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-foreground">
                      {instruction.bankAccountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(instruction.bankAccountNumber!, "acc")
                      }
                      className="p-1 hover:text-gold transition text-muted-foreground"
                    >
                      {copiedField === "acc" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {instruction.bankAccountHolder && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Chủ tài khoản:</span>
                  <span className="text-foreground font-medium">
                    {instruction.bankAccountHolder}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {instruction.checkoutUrl && (
                <a
                  href={instruction.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 py-2.5 text-xs font-semibold text-gold transition hover:bg-gold/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Mở trang PayOS
                </a>
              )}
              <button
                type="button"
                onClick={handleCheckCompleted}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gold py-2.5 text-xs font-semibold text-primary-foreground shadow glow-gold transition hover:opacity-95"
              >
                <Check className="h-3.5 w-3.5" />
                Đã chuyển khoản xong
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
