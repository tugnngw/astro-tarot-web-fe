import { useState } from "react";
import { AlertCircle, Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import {
  useReaderApplications,
  useReviewApplication,
} from "@/features/admin/queries";
import type { ReaderApplication } from "@/api/admin";

import { Pagination, PagedList, PAGE_SIZE } from "@/components/Pagination";
import { useRowBusy } from "@/lib/row-busy";
/**
 * Hàng chờ hồ sơ xin làm Reader. Duyệt xong người nộp sẽ thành STAFF ở BE.
 *
 * BE trả về List<Map<String,Object>> nên không có gì bảo đảm tên trường; mọi
 * chỗ đọc dữ liệu ở đây đều có đường lùi thay vì tin chắc vào một cấu trúc.
 */
export function ReaderApplications() {
  const query = useReaderApplications();
  const review = useReviewApplication();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const applications = query.data ?? [];

  // BE trả cả danh sách một lượt (số hồ sơ chờ vốn nhỏ), nên cắt trang ngay
  // tại đây thay vì thêm tham số phân trang cho một endpoint chưa cần tới.
  const [page, setPage] = useState(0);
  const dong = useRowBusy();
  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const trangHienTai = Math.min(page, totalPages - 1);
  const trangNay = applications.slice(
    trangHienTai * PAGE_SIZE,
    (trangHienTai + 1) * PAGE_SIZE,
  );

  async function approve(app: ReaderApplication) {
    const id = idOf(app);
    if (!id) {
      toast.error("Hồ sơ này thiếu mã định danh, không duyệt được");
      return;
    }
    try {
      await dong.chay(id, () =>
        review.mutateAsync({ applicationId: id, action: "APPROVED" }),
      );
      toast.success("Đã duyệt — người này giờ là Nhân viên");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không duyệt được hồ sơ");
    }
  }

  async function reject(app: ReaderApplication) {
    const id = idOf(app);
    if (!id) return;
    try {
      await dong.chay(id, () =>
        review.mutateAsync({
          applicationId: id,
          action: "REJECTED",
          rejectionReason: reason.trim() || undefined,
        }),
      );
      toast.success("Đã từ chối hồ sơ");
      setRejecting(null);
      setReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không từ chối được hồ sơ");
    }
  }

  if (query.isError) {
    return (
      <section className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <p className="mt-3 text-sm text-muted-foreground">
          {query.error instanceof Error
            ? query.error.message
            : "Không tải được danh sách hồ sơ"}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-4 rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10"
        >
          Thử lại
        </button>
      </section>
    );
  }

  if (query.isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="glass h-28 animate-pulse rounded-2xl"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <section className="glass flex flex-col items-center rounded-2xl px-6 py-14 text-center">
        <Inbox aria-hidden="true" className="h-9 w-9 text-gold/50" />
        <h3 className="mt-3 font-display text-lg">
          Không có hồ sơ nào chờ duyệt
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Khi có người nộp hồ sơ xin làm Reader, hồ sơ sẽ xuất hiện ở đây.
        </p>
      </section>
    );
  }

  return (
    <div>
      <PagedList resetKey={trangHienTai === 0 ? "dau" : "sau"}>
        <div className="space-y-3">
          {trangNay.map((app, index) => {
            const id = idOf(app) ?? String(index);
            const specialties = Array.isArray(app.specialties)
              ? app.specialties
              : [];
            return (
              <article key={id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg">
                      {app.fullName ?? "Người dùng không rõ tên"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {app.email ?? "—"}
                      {typeof app.experience === "number" && (
                        <> · {app.experience} năm kinh nghiệm</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={dong.ban(id)}
                      onClick={() => void approve(app)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-40"
                    >
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={dong.ban(id)}
                      onClick={() => {
                        setRejecting(rejecting === id ? null : id);
                        setReason("");
                      }}
                      aria-expanded={rejecting === id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                      Từ chối
                    </button>
                  </div>
                </div>

                {app.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {app.bio}
                  </p>
                )}

                {specialties.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <li
                        key={s}
                        className="rounded-full border border-gold/25 px-2.5 py-0.5 text-[11px] text-gold/80"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {rejecting === id && (
                  <div className="mt-4 rounded-xl border border-destructive/25 p-3">
                    <label
                      htmlFor={`reason-${id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Lý do từ chối (người nộp sẽ đọc được)
                    </label>
                    <textarea
                      id={`reason-${id}`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                      placeholder="Ví dụ: hồ sơ chưa nêu rõ kinh nghiệm thực tế..."
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejecting(null)}
                        className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs text-foreground/80 transition hover:border-gold/50"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        disabled={dong.ban(id)}
                        onClick={() => void reject(app)}
                        className="rounded-full bg-destructive px-3.5 py-1.5 text-xs text-destructive-foreground transition hover:opacity-90 disabled:opacity-40"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </PagedList>
      <Pagination
        page={trangHienTai}
        totalPages={totalPages}
        totalElements={applications.length}
        onChange={setPage}
        unit="hồ sơ"
      />
    </div>
  );
}

/** BE có thể gọi trường này là `id` hoặc `applicationId` tuỳ chỗ. */
function idOf(app: ReaderApplication): string | null {
  const raw = app.applicationId ?? app.id;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
