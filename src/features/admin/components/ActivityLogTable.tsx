import { useState } from "react";
import { AlertCircle, ScrollText } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { ACTION_LABEL, type ActivityLog } from "@/api/admin";
import { useActivityLogs } from "@/features/admin/queries";
import { PagedList, Pagination } from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Nhật ký hệ thống — cố định 6 dòng/trang, tách khỏi nhảy layout khi sang trang. */
const ACTIVITY_PAGE_SIZE = 6;

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
  const query = useActivityLogs({
    action: action || undefined,
    page,
    size: ACTIVITY_PAGE_SIZE,
  });

  const logs = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  const totalElements = query.data?.totalElements ?? 0;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Nhật ký hệ thống</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Mọi thao tác đổi vai trò, khoá tài khoản và gửi lại mật khẩu đều
            được ghi lại kèm người thực hiện. Nhật ký chỉ đọc — không sửa, không
            xoá được từ giao diện.
          </p>
        </div>
        <Select
          value={action || "__all__"}
          onValueChange={(v) => {
            setAction(v === "__all__" ? "" : v);
            setPage(0);
          }}
        >
          <SelectTrigger
            aria-label="Lọc theo hành động"
            className="h-auto w-auto min-w-[11rem] gap-1.5 rounded-full border-gold/30 bg-input/70 px-4 py-2 text-sm text-foreground shadow-none focus:ring-1 focus:ring-gold/40 data-[state=open]:border-gold"
          >
            <SelectValue placeholder="Mọi hành động" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-gold/25 bg-card text-foreground shadow-xl">
            <SelectItem
              value="__all__"
              className="cursor-pointer rounded-lg py-2 pl-3 pr-8 text-sm focus:bg-gold/15 focus:text-gold data-[state=checked]:bg-gold/10 data-[state=checked]:text-gold"
            >
              Mọi hành động
            </SelectItem>
            {Object.entries(ACTION_LABEL).map(([key, label]) => (
              <SelectItem
                key={key}
                value={key}
                className="cursor-pointer rounded-lg py-2 pl-3 pr-8 text-sm focus:bg-gold/15 focus:text-gold data-[state=checked]:bg-gold/10 data-[state=checked]:text-gold"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        aria-live="polite"
        aria-busy={query.isFetching}
        className="mt-5"
      >
        {query.isError ? (
          <PagedList pageSize={ACTIVITY_PAGE_SIZE}>
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/70" />
              <p className="mt-3 text-sm text-muted-foreground">
                {query.error instanceof Error
                  ? query.error.message
                  : "Không tải được nhật ký"}
              </p>
            </div>
          </PagedList>
        ) : query.isPending ? (
          <PagedList pageSize={ACTIVITY_PAGE_SIZE}>
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: ACTIVITY_PAGE_SIZE }, (_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-mystic/10"
                  aria-hidden="true"
                />
              ))}
            </div>
          </PagedList>
        ) : logs.length === 0 ? (
          <PagedList pageSize={ACTIVITY_PAGE_SIZE}>
            <div className="flex flex-col items-center py-14 text-center">
              <ScrollText aria-hidden="true" className="h-9 w-9 text-gold/50" />
              <h3 className="mt-3 font-display text-lg">
                Chưa có thao tác nào được ghi
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Nhật ký bắt đầu ghi từ lần đổi vai trò hoặc khoá tài khoản đầu
                tiên.
              </p>
            </div>
          </PagedList>
        ) : (
          // key theo bộ lọc: đổi lọc thì đo lại chiều cao, tránh giữ min-height cũ.
          <PagedList key={action || "all"} pageSize={ACTIVITY_PAGE_SIZE}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[7.5rem]" />
                  <col className="w-[11rem]" />
                  <col className="w-[10rem]" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b border-gold/15 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Thời điểm
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Người thực hiện
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Hành động
                    </th>
                    <th scope="col" className="py-2 font-normal">
                      Thay đổi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="h-16 border-b border-white/5 last:border-0"
                    >
                      <td className="whitespace-nowrap py-2 pr-3 align-middle text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(l.createdAt)}
                      </td>
                      <td className="py-2 pr-3 align-middle">
                        <span className="block truncate text-foreground">
                          {l.actorName}
                        </span>
                        {l.actorRole && (
                          <RoleBadge role={l.actorRole} className="mt-1" />
                        )}
                      </td>
                      <td className="py-2 pr-3 align-middle">
                        <span className="line-clamp-2">
                          {ACTION_LABEL[l.action] ?? l.action}
                        </span>
                      </td>
                      <td className="py-2 align-middle text-xs text-muted-foreground">
                        <div className="line-clamp-2 overflow-hidden">
                          <Changes log={l} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PagedList>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onChange={setPage}
        busy={query.isFetching}
        unit="hoạt động"
        pageSize={ACTIVITY_PAGE_SIZE}
      />
    </section>
  );
}

/**
 * Cột "thay đổi" đọc từ JSON thô mà BE ghi.
 *
 * Dạng {from, to} là đổi một giá trị — hiện thành mũi tên. Còn lại thì liệt kê
 * khoá và giá trị trên một dòng (tránh hàng cao thấp khác nhau làm nhảy layout).
 * JSON hỏng thì hiện nguyên văn chứ không làm sập cả bảng.
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
  if (
    entries.length === 2 &&
    "from" in (parsed as object) &&
    "to" in (parsed as object)
  ) {
    const o = parsed as { from: unknown; to: unknown };
    return (
      <span className="whitespace-nowrap">
        <code>{String(o.from)}</code> →{" "}
        <code className="text-gold">{String(o.to)}</code>
      </span>
    );
  }

  return (
    <span className="break-words">
      {entries.map(([k, v], i) => (
        <span key={k}>
          {i > 0 ? " · " : null}
          <span className="text-muted-foreground/70">{k}:</span>{" "}
          {isFromTo(v) ? (
            <>
              <code>{String(v.from)}</code> →{" "}
              <code className="text-gold">{String(v.to)}</code>
            </>
          ) : (
            <code>{String(v)}</code>
          )}
        </span>
      ))}
    </span>
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
