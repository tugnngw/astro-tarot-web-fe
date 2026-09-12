import { useState, useRef } from "react";
import { AlertCircle, Banknote, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PAYOUT_STATUS_LABEL, type PayoutStatus } from "@/api/money";
import {
  useCreatePayout,
  useMyEscrow,
  useMyPayouts,
} from "@/features/money/queries";
import { formatVND } from "@/lib/mock-data";
import { DANH_SACH_NGAN_HANG, timNganHang } from "@/lib/banks";
import { SoCaiKyQuy } from "./EscrowLedger";

import {
  Pagination,
  PagedList,
  useCoTrangVuaManHinh,
} from "@/components/Pagination";
const STATUS_CLASS: Record<PayoutStatus, string> = {
  PENDING: "border-amber-400/40 text-amber-300",
  APPROVED: "border-sky-400/40 text-sky-300",
  REJECTED: "border-destructive/40 text-destructive",
  PAID: "border-emerald-400/40 text-emerald-300",
};

/**
 * Thu nhập và rút tiền của Reader.
 *
 * Hai con số đứng cạnh nhau vì chúng hay bị hiểu nhầm thành một: "đang giữ" là
 * tiền khách đã trả cho buổi xem CHƯA hoàn tất, "rút được" mới là tiền thật sự
 * dùng được. Ghi rõ ngay dưới mỗi con số, đừng bắt Reader đoán.
 */
export function EarningsPanel() {
  const escrow = useMyEscrow();
  const [payoutPage, setPayoutPage] = useState(0);
  // Cỡ trang theo màn hình thật: một trang vừa một màn, khỏi cuộn
  // xuống mới bấm được sang trang.
  const listRef = useRef<HTMLDivElement>(null);
  const coTrang = useCoTrangVuaManHinh(listRef);
  const payouts = useMyPayouts(payoutPage, true, coTrang);
  const create = useCreatePayout();

  const [open, setOpen] = useState(false);
  // Giữ mã BIN chứ không giữ tên ngân hàng: tên suy ra được từ mã, còn mã thì
  // không suy ra được từ tên ("VCB" và "Vietcombank" là cùng một nơi).
  const [form, setForm] = useState({
    amount: "",
    bankBin: "",
    bankAccount: "",
    accountHolder: "",
  });

  const e = escrow.data;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    try {
      const nganHang = timNganHang(form.bankBin);
      if (!nganHang) {
        toast.error("Chọn ngân hàng trong danh sách");
        return;
      }
      await create.mutateAsync({
        amount,
        // Tên ngân hàng suy ra từ mã BIN chứ không cho gõ tay: gõ tay thì
        // "VCB" và "Vietcombank" thành hai ngân hàng khác nhau trong mắt máy.
        bankName: nganHang.ten,
        bankBin: nganHang.bin,
        bankAccount: form.bankAccount.trim(),
        accountHolder: form.accountHolder.trim(),
      });
      toast.success("Đã gửi lệnh rút, chờ quản trị viên duyệt");
      setOpen(false);
      setForm({ amount: "", bankBin: "", bankAccount: "", accountHolder: "" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không gửi được lệnh rút",
      );
    }
  }

  if (escrow.isError) {
    return (
      <section className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <p className="mt-3 text-sm text-muted-foreground">
          {escrow.error instanceof Error
            ? escrow.error.message
            : "Không tải được ký quỹ"}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Wallet aria-hidden="true" className="h-5 w-5 text-gold" />
          Ký quỹ
        </h2>

        {escrow.isPending ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true">
            <div className="h-24 animate-pulse rounded-xl bg-mystic/10" />
            <div className="h-24 animate-pulse rounded-xl bg-mystic/10" />
          </div>
        ) : (
          <>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Rút được
                </dt>
                <dd className="mt-1 font-display text-2xl text-gold">
                  {formatVND(e!.balance)}
                </dd>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Đã trừ phí nền tảng, dùng được ngay.
                </p>
              </div>
              <div className="rounded-xl border border-gold/15 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Đang giữ
                </dt>
                <dd className="mt-1 font-display text-2xl text-foreground/80">
                  {formatVND(e!.pendingBalance)}
                </dd>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Khách đã trả, buổi xem chưa hoàn tất.
                </p>
              </div>
            </dl>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex justify-between rounded-lg border border-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Tổng đã nhận</dt>
                <dd className="tabular-nums">{formatVND(e!.totalEarned)}</dd>
              </div>
              <div className="flex justify-between rounded-lg border border-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Tổng đã rút</dt>
                <dd className="tabular-nums">{formatVND(e!.totalWithdrawn)}</dd>
              </div>
            </dl>

            {(e!.penaltyOwed ?? 0) > 0 && (
              <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                Bạn đang nợ {formatVND(e!.penaltyOwed!)} tiền phạt vi phạm. Số
                này sẽ tự trừ vào các buổi xem tới, nên thu nhập mấy lần sau sẽ
                thấp hơn cho tới khi trừ hết.
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              disabled={e!.balance < e!.minimumPayout}
              aria-expanded={open}
              title={
                e!.balance < e!.minimumPayout
                  ? `Cần tối thiểu ${formatVND(e!.minimumPayout)} mới rút được`
                  : undefined
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground glow-gold transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Banknote aria-hidden="true" className="h-4 w-4" />
              Rút tiền
            </button>
            {e!.balance < e!.minimumPayout && (
              <p className="mt-2 text-xs text-muted-foreground">
                Mức rút tối thiểu là {formatVND(e!.minimumPayout)} — dưới mức đó
                thì phí chuyển khoản ăn gần hết số tiền.
              </p>
            )}
          </>
        )}

        {open && (
          <form
            onSubmit={submit}
            className="mt-4 space-y-3 rounded-xl border border-gold/25 p-4"
          >
            <Field
              label={`Số tiền (tối đa ${formatVND(e?.balance ?? 0)})`}
              value={form.amount}
              onChange={(v) =>
                setForm((f) => ({ ...f, amount: v.replace(/[^0-9]/g, "") }))
              }
              inputMode="numeric"
            />
            <label className="block">
              <span className="text-xs text-muted-foreground">Ngân hàng</span>
              <select
                value={form.bankBin}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, bankBin: ev.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-gold/60"
              >
                <option value="">— Chọn ngân hàng —</option>
                {DANH_SACH_NGAN_HANG.map((n) => (
                  <option key={n.bin} value={n.bin}>
                    {n.ten} — {n.tenDayDu}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Số tài khoản"
              value={form.bankAccount}
              onChange={(v) => setForm((f) => ({ ...f, bankAccount: v }))}
            />
            <Field
              label="Chủ tài khoản"
              value={form.accountHolder}
              onChange={(v) => setForm((f) => ({ ...f, accountHolder: v }))}
            />
            <p className="text-[11px] text-muted-foreground">
              Số dư bị trừ ngay khi gửi lệnh. Nếu bị từ chối, tiền quay lại số
              dư.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-mystic/50 px-4 py-1.5 text-xs"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-full bg-gold px-5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {create.isPending ? "Đang gửi…" : "Gửi lệnh rút"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl">Lịch sử rút tiền</h2>
        {payouts.isPending ? (
          <div className="mt-4 space-y-2" aria-busy="true">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-mystic/10"
              />
            ))}
          </div>
        ) : (payouts.data?.content.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Bạn chưa rút lần nào.
          </p>
        ) : (
          <PagedList pageSize={coTrang} listRef={listRef}>
            <ul className="mt-4 space-y-2">
              {payouts.data!.content.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-display text-lg text-gold">
                      {formatVND(p.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.bankName} · {p.bankAccountMasked}
                    </p>
                    {p.rejectReason && (
                      <p className="mt-1 text-xs text-destructive">
                        {p.rejectReason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_CLASS[p.status]}`}
                  >
                    {PAYOUT_STATUS_LABEL[p.status]}
                  </span>
                </li>
              ))}
            </ul>
          </PagedList>
        )}

        {/* Hiện cả khi chỉ có một trang: dòng "1–6 trên 6 lệnh rút" là thông
            tin Reader cần, không phụ thuộc việc có sang trang được hay không. */}
        {!payouts.isPending && (
          <Pagination
            page={payoutPage}
            totalPages={payouts.data?.totalPages ?? 1}
            totalElements={payouts.data?.totalElements ?? 0}
            onChange={setPayoutPage}
            pageSize={coTrang}
            busy={payouts.isFetching}
            unit="lệnh rút"
          />
        )}
      </section>

      <SoCaiKyQuy />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}
