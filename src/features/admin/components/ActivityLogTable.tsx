import { useState } from "react";
import { AlertCircle, ScrollText } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { ACTION_LABEL, type ActivityLog } from "@/api/admin";
import { useActivityLogs } from "@/features/admin/queries";

const PAGE_SIZE = 30;

/**
 * Nhật ký thao tác quản trị.
 *
 * Đọc theo lối "ai làm gì với ai": cột trái là người thực hiện, cột giữa là
 * hành động, cột phải là thay đổi cụ thể. Không có nó thì khi một tài khoản bị
 * hạ quyền hay bị khoá, không ai truy được là ai làm — mà đó đúng là những
 * thao tác dễ gây tranh cãi nhất.
 */
export function ActivityLogTable() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const query = useActivityLogs({ action: action || undefined, page, size: PAGE_SIZE });

  const logs = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Nhật ký hệ thống</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Mọi thao tác đổi vai trò, khoá tài khoản và gửi lại mật khẩu đều được
            ghi lại kèm người thực hiện. Nhật ký chỉ đọc — không sửa, không xoá
            được từ giao diện.
          </p>
        </div>
        <select
          aria-label="Lọc theo hành động"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          className="rounded-full border border-gold/30 bg-input/70 px-4 py-2 text-sm text-foreground outline-none focus:border-gold"
        >
          <option value="">Mọi hành động</option>
          {Object.entries(ACTION_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-busy={query.isFetching} className="mt-5">
        {query.isError ? (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive/70" />
            <p className="mt-3 text-sm text-muted-foreground">
              {query.error instanceof Error ? query.error.message : "Không tải được nhật ký"}
            </p>
          </div>
        ) : query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-mystic/10" aria-hidden="true" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <ScrollText aria-hidden="true" className="h-9 w-9 text-gold/50" />
            <h3 className="mt-3 font-display text-lg">Chưa có thao tác nào được ghi</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Nhật ký bắt đầu ghi từ lần đổi vai trò hoặc khoá tài khoản đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gold/15 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-normal">Thời điểm</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Người thực hiện</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Hành động</th>
                  <th scope="col" className="py-2 font-normal">Thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 align-top last:border-0">
                    <td className="whitespace-nowrap py-3 pr-3 text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="block text-foreground">{l.actorName}</span>
                      {l.actorRole && <RoleBadge role={l.actorRole} className="mt-1" />}
                    </td>
                    <td className="py-3 pr-3">{ACTION_LABEL[l.action] ?? l.action}</td>
                    <td className="py-3 text-xs text-muted-foreground">
                      <Changes log={l} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Phân trang nhật ký">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border border-gold/40 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-gold/40 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </nav>
      )}
    </section>
  );
}

/**
 * Cột "thay đổi" đọc từ JSON thô mà BE ghi.
 *
 * Dạng {from, to} là đổi một giá trị — hiện thành mũi tên. Còn lại thì liệt kê
 * khoá và giá trị. JSON hỏng thì hiện nguyên văn chứ không làm sập cả bảng.
 */
function Changes({ log }: { log: ActivityLog }) {
  if (!log.changes) return <span>—</span>;

  let parsed: unknown;
  try {
    parsed = JSON.parse(log.changes);
  } catch {
    return <code className="break-all">{log.changes}</code>;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return <span>{String(parsed)}</span>;
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 2 && "from" in (parsed as object) && "to" in (parsed as object)) {
    const o = parsed as { from: unknown; to: unknown };
    return (
      <span className="whitespace-nowrap">
        <code>{String(o.from)}</code> → <code className="text-gold">{String(o.to)}</code>
      </span>
    );
  }

  return (
    <ul className="space-y-0.5">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="text-muted-foreground/70">{k}:</span>{" "}
          {isFromTo(v) ? (
            <>
              <code>{String(v.from)}</code> → <code className="text-gold">{String(v.to)}</code>
            </>
          ) : (
            <code>{String(v)}</code>
          )}
        </li>
      ))}
    </ul>
  );
}

function isFromTo(v: unknown): v is { from: unknown; to: unknown } {
  return typeof v === "object" && v !== null && "from" in v && "to" in v;
}

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DATE_TIME_FORMAT.format(d);
}
