import { useState } from "react";
import { AlertCircle, Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import {
  PAYOUT_STATUS_LABEL,
  REPORT_STATUS_LABEL,
  TRANSACTION_STATUS_LABEL,
  type PayoutStatus,
  type ReportStatus,
  type TransactionStatus,
} from "@/api/money";
import {
  useApprovePayout,
  useConfirmPayment,
  useHandleReport,
  useMarkPayoutPaid,
  usePayments,
  usePayouts,
  useRejectPayment,
  useRejectPayout,
  useReports,
} from "@/features/money/queries";
import { PAGE_SIZE, PagedList, Pagination } from "@/components/Pagination";
import { formatVND } from "@/lib/mock-data";

// ============================================================
// Đối soát thanh toán
// ============================================================

/**
 * Hàng chờ đối soát.
 *
 * Người trực mở sao kê ngân hàng bên cạnh và tìm theo mã tham chiếu, nên mã đó
 * phải là thứ dễ đọc nhất trên mỗi dòng — không phải tên khách hay số tiền.
 */
export function PaymentQueue() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(0);
  const query = usePayments({ status: status || undefined, page, size: PAGE_SIZE });
  const confirm = useConfirmPayment();
  const reject = useRejectPayment();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const busy = confirm.isPending || reject.isPending;
  const items = query.data?.content ?? [];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Đối soát thanh toán</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Mở sao kê ngân hàng, tìm khoản có nội dung khớp mã tham chiếu, rồi xác
            nhận. Xác nhận xong tiền vào ký quỹ của Reader và chỉ nhả khi buổi xem
            hoàn tất.
          </p>
        </div>
        <StatusFilter
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          labels={TRANSACTION_STATUS_LABEL as Record<string, string>}
        />
      </div>

      <Body
        resetKey={status}
        query={query}
        emptyTitle="Không có giao dịch nào"
        emptyHint="Khi khách tạo lệnh chuyển khoản, giao dịch sẽ xuất hiện ở đây."
      >
        <ul className="mt-4 space-y-2">
          {items.map((t) => (
            <li key={t.id} className="rounded-xl border border-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-base tracking-wider text-gold">
                    {t.referenceCode ?? "—"}
                  </p>
                  <p className="mt-1 text-sm">
                    {t.payerName}
                    {t.readerName && (
                      <span className="text-muted-foreground"> → {t.readerName}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(t.createdAt)}
                    {t.bookingStartTime && ` · buổi xem ${formatDateTime(t.bookingStartTime)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-gold">{formatVND(t.amount)}</p>
                  <Badge
                    label={TRANSACTION_STATUS_LABEL[t.status]}
                    tone={
                      t.status === "SUCCESS"
                        ? "ok"
                        : t.status === "PENDING"
                          ? "warn"
                          : "bad"
                    }
                  />
                </div>
              </div>

              {t.status === "PENDING" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => confirm.mutateAsync(t.id), "Đã xác nhận thanh toán")
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-40"
                  >
                    <Check aria-hidden="true" className="h-3.5 w-3.5" /> Đã nhận tiền
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRejecting(rejecting === t.id ? null : t.id);
                      setReason("");
                    }}
                    aria-expanded={rejecting === t.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" /> Không tìm thấy
                  </button>
                </div>
              )}

              {rejecting === t.id && (
                <InlineReason
                  value={reason}
                  onChange={setReason}
                  placeholder="Ví dụ: không có khoản nào khớp mã này trong sao kê hôm nay"
                  onCancel={() => setRejecting(null)}
                  onConfirm={async () => {
                    const ok = await run(
                      () => reject.mutateAsync({ id: t.id, reason: reason.trim() || undefined }),
                      "Đã đánh dấu không đối soát được",
                    );
                    if (ok) setRejecting(null);
                  }}
                  confirmLabel="Xác nhận"
                  busy={busy}
                />
              )}
            </li>
          ))}
        </ul>
      </Body>

      <Pagination
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        totalElements={query.data?.totalElements ?? 0}
        onChange={setPage}
        busy={query.isFetching}
        unit="giao dịch"
      />
    </section>
  );
}

// ============================================================
// Duyệt lệnh rút
// ============================================================

export function PayoutQueue() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(0);
  const query = usePayouts({ status: status || undefined, page, size: PAGE_SIZE });
  const approve = useApprovePayout();
  const reject = useRejectPayout();
  const markPaid = useMarkPayoutPaid();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const busy = approve.isPending || reject.isPending || markPaid.isPending;
  const items = query.data?.content ?? [];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Lệnh rút tiền</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Hai bước tách riêng có chủ ý: <strong className="text-foreground">Duyệt</strong> là
            đồng ý chi, <strong className="text-foreground">Đã chuyển</strong> là xác nhận tiền
            đã thật sự rời tài khoản. Gộp lại thì hệ thống nói đã chi trong khi kế
            toán chưa bấm nút.
          </p>
        </div>
        <StatusFilter
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          labels={PAYOUT_STATUS_LABEL as Record<string, string>}
        />
      </div>

      <Body
        resetKey={status}
        query={query}
        emptyTitle="Không có lệnh rút nào"
        emptyHint="Reader gửi lệnh rút từ tab Thu nhập ở bàn làm việc."
      >
        <ul className="mt-4 space-y-2">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{p.readerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.bankName} · {p.bankAccountMasked} · {p.accountHolder}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gửi lúc {formatDateTime(p.requestedAt)}
                  </p>
                  {p.rejectReason && (
                    <p className="mt-1 text-xs text-destructive">{p.rejectReason}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-gold">{formatVND(p.amount)}</p>
                  <Badge
                    label={PAYOUT_STATUS_LABEL[p.status]}
                    tone={
                      p.status === "PAID"
                        ? "ok"
                        : p.status === "REJECTED"
                          ? "bad"
                          : "warn"
                    }
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => approve.mutateAsync(p.id), "Đã duyệt lệnh rút")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-40"
                    >
                      <Check aria-hidden="true" className="h-3.5 w-3.5" /> Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setRejecting(rejecting === p.id ? null : p.id);
                        setReason("");
                      }}
                      aria-expanded={rejecting === p.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" /> Từ chối
                    </button>
                  </>
                )}

                {p.status === "APPROVED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => markPaid.mutateAsync(p.id), "Đã ghi nhận chuyển khoản")
                    }
                    className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Đã chuyển tiền
                  </button>
                )}
              </div>

              {rejecting === p.id && (
                <InlineReason
                  value={reason}
                  onChange={setReason}
                  placeholder="Ví dụ: tên chủ tài khoản không khớp hồ sơ"
                  onCancel={() => setRejecting(null)}
                  onConfirm={async () => {
                    const ok = await run(
                      () => reject.mutateAsync({ id: p.id, reason: reason.trim() || undefined }),
                      "Đã từ chối, tiền quay lại số dư của Reader",
                    );
                    if (ok) setRejecting(null);
                  }}
                  confirmLabel="Từ chối"
                  busy={busy}
                />
              )}
            </li>
          ))}
        </ul>
      </Body>

      <Pagination
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        totalElements={query.data?.totalElements ?? 0}
        onChange={setPage}
        busy={query.isFetching}
        unit="yêu cầu rút"
      />
    </section>
  );
}

// ============================================================
// Báo cáo vi phạm
// ============================================================

export function ReportQueue() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(0);
  const query = useReports({ status: status || undefined, page, size: PAGE_SIZE });
  const handle = useHandleReport();
  const [handling, setHandling] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<ReportStatus>("RESOLVED");

  const items = query.data?.content ?? [];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Báo cáo vi phạm</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Người bị báo cáo không biết ai đã báo — đừng nhắc tên người tố cáo trong
            kết luận. Chỉ người tố nhận thông báo; xử lý người vi phạm (nhắc nhở,
            khoá tài khoản) làm riêng ở màn Tài khoản.
          </p>
        </div>
        <StatusFilter
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          labels={REPORT_STATUS_LABEL as Record<string, string>}
        />
      </div>

      <Body
        resetKey={status}
        query={query}
        emptyTitle="Không có báo cáo nào"
        emptyHint="Khách gửi báo cáo từ trang Lịch hẹn của tôi sau khi buổi xem hoàn tất."
      >
        <ul className="mt-4 space-y-2">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Bị báo cáo:</span>{" "}
                    <span className="text-foreground">{r.reportedName}</span>{" "}
                    <span className="text-xs text-muted-foreground">({r.reportedRole})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Người báo: {r.reporterName} · {formatDateTime(r.createdAt)}
                  </p>
                  <p className="mt-2 inline-block rounded border border-gold/25 px-2 py-0.5 text-[11px] text-gold/80">
                    {r.reportType}
                  </p>
                  {r.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                  {r.resolutionNote && (
                    <p className="mt-2 rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="text-emerald-300">Kết luận:</span> {r.resolutionNote}
                      {r.handledByName && ` — ${r.handledByName}`}
                    </p>
                  )}
                </div>
                <Badge
                  label={REPORT_STATUS_LABEL[r.status]}
                  tone={
                    r.status === "RESOLVED"
                      ? "ok"
                      : r.status === "REJECTED"
                        ? "bad"
                        : "warn"
                  }
                />
              </div>

              {(r.status === "PENDING" || r.status === "REVIEWED") && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHandling(handling === r.id ? null : r.id);
                      setNote("");
                      setDecision("RESOLVED");
                    }}
                    aria-expanded={handling === r.id}
                    className="rounded-full border border-gold/50 px-3.5 py-1.5 text-xs text-gold transition hover:bg-gold/10"
                  >
                    Ghi kết luận
                  </button>

                  {handling === r.id && (
                    <div className="mt-3 rounded-xl border border-gold/25 p-3">
                      <fieldset>
                        <legend className="text-xs text-muted-foreground">Kết luận</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["REVIEWED", "RESOLVED", "REJECTED"] as ReportStatus[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setDecision(s)}
                              aria-pressed={decision === s}
                              className={
                                decision === s
                                  ? "rounded-full border border-gold bg-gold/20 px-3 py-1 text-xs text-gold"
                                  : "rounded-full border border-mystic/50 px-3 py-1 text-xs text-foreground/80"
                              }
                            >
                              {REPORT_STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        aria-label="Nội dung kết luận"
                        placeholder="Người báo cáo sẽ đọc được câu này."
                        className="mt-3 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setHandling(null)}
                          className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
                        >
                          Để sau
                        </button>
                        <button
                          type="button"
                          disabled={handle.isPending}
                          onClick={async () => {
                            const ok = await run(
                              () =>
                                handle.mutateAsync({
                                  id: r.id,
                                  status: decision,
                                  note: note.trim() || undefined,
                                }),
                              "Đã ghi kết luận",
                            );
                            if (ok) setHandling(null);
                          }}
                          className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                        >
                          Lưu kết luận
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Body>

      <Pagination
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        totalElements={query.data?.totalElements ?? 0}
        onChange={setPage}
        busy={query.isFetching}
        unit="báo cáo"
      />
    </section>
  );
}

// ============================================================
// Dùng chung
// ============================================================

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

function StatusFilter({
  value,
  onChange,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  labels: Record<string, string>;
}) {
  return (
    <select
      aria-label="Lọc theo trạng thái"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-gold/30 bg-input/70 px-4 py-2 text-sm text-foreground outline-none focus:border-gold"
    >
      <option value="">Tất cả</option>
      {Object.entries(labels).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Badge({ label, tone }: { label: string; tone: "ok" | "warn" | "bad" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-400/40 text-emerald-300"
      : tone === "warn"
        ? "border-amber-400/40 text-amber-300"
        : "border-destructive/40 text-destructive";
  return (
    <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${cls}`}>
      {label}
    </span>
  );
}

/**
 * Khung chung cho ba bảng: lỗi / đang tải / rỗng / có dữ liệu.
 *
 * Bọc trong PagedList để mọi trang cao bằng nhau — trang cuối ít dòng hơn vẫn
 * chiếm đúng khoảng đó, nên nút "Trang sau" không chạy lên khỏi chỗ vừa bấm.
 */
function Body({
  query,
  emptyTitle,
  emptyHint,
  resetKey,
  children,
}: {
  query: { isPending: boolean; isError: boolean; error: unknown; data?: { content: unknown[] } };
  emptyTitle: string;
  emptyHint: string;
  /** Đổi bộ lọc thì quên chiều cao đã nhớ. */
  resetKey?: string | number;
  children: React.ReactNode;
}) {
  if (query.isError) {
    return (
      <PagedList resetKey={resetKey}>
      <div className="flex flex-col items-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <p className="mt-3 text-sm text-muted-foreground">
          {query.error instanceof Error ? query.error.message : "Không tải được dữ liệu"}
        </p>
      </div>
      </PagedList>
    );
  }
  if (query.isPending) {
    return (
      <PagedList resetKey={resetKey}>
        <div className="mt-4 space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-mystic/10" aria-hidden="true" />
          ))}
        </div>
      </PagedList>
    );
  }
  if ((query.data?.content.length ?? 0) === 0) {
    return (
      <PagedList resetKey={resetKey}>
      <div className="flex flex-col items-center py-14 text-center">
        <Inbox aria-hidden="true" className="h-9 w-9 text-gold/50" />
        <h3 className="mt-3 font-display text-lg">{emptyTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
      </div>
      </PagedList>
    );
  }
  return <PagedList resetKey={resetKey}>{children}</PagedList>;
}

function InlineReason({
  value,
  onChange,
  placeholder,
  onCancel,
  onConfirm,
  confirmLabel,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  busy: boolean;
}) {
  return (
    <div className="mt-3 rounded-xl border border-destructive/25 p-3">
      <label className="text-xs text-muted-foreground">
        Lý do — người nhận sẽ đọc được
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
        />
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
        >
          Huỷ
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="rounded-full bg-destructive px-3.5 py-1.5 text-xs text-destructive-foreground disabled:opacity-40"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DATE_TIME_FORMAT.format(d);
}
