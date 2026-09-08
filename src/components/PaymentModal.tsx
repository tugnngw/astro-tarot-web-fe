import { motion, AnimatePresence } from "framer-motion";
import { formatVND, type Reader } from "@/lib/mock-data";

interface Props {
  open: boolean;
  reader: Reader | null;
  slot: string | null;
  onClose: () => void;
  onConfirm: (method: "vnpay" | "momo") => void;
}

export function PaymentModal({
  open,
  reader,
  slot,
  onClose,
  onConfirm,
}: Props) {
  return (
    <AnimatePresence>
      {open && reader && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass w-full max-w-md rounded-2xl p-6 glow-gold"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl text-gradient-gold">
              Xác nhận đặt lịch
            </h3>
            <div className="mt-4 space-y-2 rounded-lg border border-border bg-card/50 p-4 text-sm">
              <Row label="Chuyên gia" value={reader.name} />
              <Row label="Thời lượng" value="15 phút" />
              <Row label="Khung giờ" value={slot ?? "—"} />
              <div className="my-2 h-px bg-border" />
              <Row
                label="Tổng cộng"
                value={formatVND(reader.pricePer15m)}
                highlight
              />
            </div>

            <p className="mt-4 flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <span>🔒</span>
              Tiền được giữ trong tài khoản ký quỹ cho đến khi buổi xem kết
              thúc.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => onConfirm("vnpay")}
                className="rounded-xl border border-border bg-card p-4 text-center transition hover:border-gold hover:bg-card/80"
              >
                <div className="text-2xl">💳</div>
                <div className="mt-1 text-sm font-medium">VNPay</div>
              </button>
              <button
                onClick={() => onConfirm("momo")}
                className="rounded-xl border border-border bg-card p-4 text-center transition hover:border-gold hover:bg-card/80"
              >
                <div className="text-2xl">📱</div>
                <div className="mt-1 text-sm font-medium">Momo</div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Huỷ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          highlight ? "text-lg font-semibold text-gold" : "text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
