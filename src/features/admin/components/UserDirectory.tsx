import { useEffect, useId, useState } from "react";
import {
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/RoleBadge";
import {
  useManagedUsers,
  useUpdateRoleBulk,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "@/features/admin/queries";
import { UserDetailPanel } from "@/features/admin/components/UserDetailPanel";
import { CreateUserDialog } from "@/features/admin/components/CreateUserDialog";
import {
  ACCOUNT_STATUS_LABEL,
  type AccountStatus,
  type ManagedUser,
} from "@/api/admin";
import { ROLE_DESCRIPTION, toAppRole, type AccountRole } from "@/lib/roles";

import { ListError, useTaiLau, SlowHint } from "@/components/ListError";
import { useRowBusy } from "@/lib/row-busy";
import { PAGE_SIZE, PagedList, Pagination } from "@/components/Pagination";

const STATUS_CLASS: Record<AccountStatus, string> = {
  PENDING: "text-amber-300",
  ACTIVE: "text-emerald-300",
  INACTIVE: "text-muted-foreground",
  BANNED: "text-destructive",
};

/**
 * Bảng tài khoản, dùng chung cho /manager và /admin.
 *
 * Khác biệt giữa hai trang gói gọn trong `assignableRoles`: quản lý chỉ được
 * đặt USER/STAFF, admin đặt được tất cả. Còn ai được sửa hàng nào thì BE quyết
 * định và trả về ở cờ `editable` — giao diện không tự suy luận lại, vì suy luận
 * lại là sớm muộn cũng lệch với luật thật.
 */
export function UserDirectory({
  assignableRoles,
  title = "Tài khoản",
  description,
}: {
  assignableRoles: AccountRole[];
  title?: string;
  description?: string;
}) {
  const searchId = useId();
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Chọn nhiều để đổi vai trò hàng loạt. Giữ theo id chứ không theo chỉ số
  // hàng: đổi trang hay đổi bộ lọc là chỉ số trỏ sang người khác.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  // Đổi bộ lọc mà giữ nguyên số trang thì rơi vào trang trống.
  useEffect(() => {
    setPage(0);
  }, [debounced, role, status]);

  const query = useManagedUsers({
    role: role || undefined,
    status: status || undefined,
    keyword: debounced || undefined,
    page,
    size: PAGE_SIZE,
  });

  // Lần tải đầu sau khi máy chủ ngủ dậy mất khoảng một phút; báo cho người
  // dùng biết thay vì để họ nhìn khung xương xám nhấp nháy trong im lặng.
  const taiLau = useTaiLau(query.isPending);

  const changeRole = useUpdateUserRole();
  const changeRoleBulk = useUpdateRoleBulk();
  const changeStatus = useUpdateUserStatus();

  const users = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  // `busy` chỉ còn dùng cho thanh thao tác hàng loạt — nó tác động lên nhiều
  // hàng cùng lúc nên khoá cả bảng là đúng. Còn nút của TỪNG hàng thì hỏi
  // `dong.ban(u.id)`: khoá tài khoản A không liên quan gì tới tài khoản B.
  const busy = changeRoleBulk.isPending;
  const dong = useRowBusy();

  // Chỉ những hàng BE cho phép sửa mới được chọn — nếu không, thao tác hàng
  // loạt sẽ bị rollback toàn bộ chỉ vì lỡ tick một tài khoản ngoài tầm.
  const selectableIds = users.filter((u) => u.editable).map((u) => u.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulkRole(role: AccountRole) {
    const ids = [...selected];
    try {
      await changeRoleBulk.mutateAsync({ userIds: ids, role });
      toast.success(`Đã đổi vai trò cho ${ids.length} tài khoản`);
      setSelected(new Set());
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Không đổi được vai trò hàng loạt",
      );
    }
  }

  async function handleRole(user: ManagedUser, next: AccountRole) {
    if (next === user.role) return;
    try {
      await dong.chay(user.id, () =>
        changeRole.mutateAsync({ userId: user.id, role: next }),
      );
      toast.success(`${user.fullName} giờ là ${ROLE_LABEL_SHORT[next]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được vai trò");
    }
  }

  async function handleStatus(user: ManagedUser, next: AccountStatus) {
    try {
      await dong.chay(user.id, () =>
        changeStatus.mutateAsync({ userId: user.id, status: next }),
      );
      toast.success(
        next === "ACTIVE"
          ? `Đã mở khoá ${user.fullName}`
          : `Đã khoá ${user.fullName}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đổi được trạng thái");
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          {description && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {query.isSuccess && (
            <p className="text-xs text-muted-foreground">
              {query.data.totalElements} tài khoản
            </p>
          )}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10"
          >
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            Tạo tài khoản
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor={searchId} className="sr-only">
            Tìm theo tên, email hoặc tên đăng nhập
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={searchId}
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên, email hoặc tên đăng nhập..."
            className="w-full rounded-full border border-gold/30 bg-input/70 py-2 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>
        <select
          aria-label="Lọc theo vai trò"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-full border border-gold/30 bg-input/70 px-4 py-2 text-sm text-foreground outline-none focus:border-gold"
        >
          <option value="">Mọi vai trò</option>
          <option value="USER">Thành viên</option>
          <option value="STAFF">Nhân viên</option>
          <option value="MANAGER">Quản lý</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-gold/30 bg-input/70 px-4 py-2 text-sm text-foreground outline-none focus:border-gold"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((s) => (
            <option key={s} value={s}>
              {ACCOUNT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Thanh thao tác hàng loạt. Chỉ hiện khi đã chọn — một thanh trống
          thường trực chỉ chiếm chỗ và làm người dùng tưởng nó hỏng. */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
          <span className="text-sm">
            Đã chọn <strong className="text-gold">{selected.size}</strong> tài
            khoản
          </span>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Đổi tất cả thành
            <select
              aria-label="Vai trò áp dụng cho các tài khoản đã chọn"
              defaultValue=""
              disabled={busy}
              onChange={(e) => {
                if (e.target.value)
                  void applyBulkRole(e.target.value as AccountRole);
                e.target.value = "";
              }}
              className="rounded-full border border-gold/40 bg-input/70 px-3 py-1 text-xs text-foreground outline-none focus:border-gold disabled:opacity-50"
            >
              <option value="">Chọn vai trò…</option>
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL_SHORT[r]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-gold"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Bảng */}
      <div aria-live="polite" aria-busy={query.isFetching} className="mt-5">
        {query.isError ? (
          <ListError
            error={query.error}
            onRetry={() => void query.refetch()}
            title="Không tải được danh sách tài khoản"
          />
        ) : query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-mystic/10"
                aria-hidden="true"
              />
            ))}
            <SlowHint show={taiLau} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Không có tài khoản nào khớp bộ lọc.
          </p>
        ) : (
          // Bảng rộng hơn màn hình hẹp: cho nó cuộn ngang trong khung của mình
          // thay vì đẩy cả trang cuộn ngang.
          <div className="overflow-x-auto">
            <PagedList>
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gold/15 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    <th scope="col" className="w-1 py-2 pr-3">
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả tài khoản sửa được trên trang này"
                        checked={allSelected}
                        disabled={selectableIds.length === 0}
                        onChange={(e) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            for (const id of selectableIds) {
                              if (e.target.checked) next.add(id);
                              else next.delete(id);
                            }
                            return next;
                          })
                        }
                        className="h-3.5 w-3.5 accent-[var(--gold)]"
                      />
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Tài khoản
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Vai trò
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Trạng thái
                    </th>
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Tham gia
                    </th>
                    <th scope="col" className="py-2 font-normal">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 align-middle last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn `}
                          checked={selected.has(u.id)}
                          disabled={!u.editable}
                          onChange={() => toggle(u.id)}
                          className="h-3.5 w-3.5 accent-[var(--gold)] disabled:opacity-30"
                        />
                      </td>

                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gold/30"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mystic/20 text-xs text-gold"
                            >
                              {u.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setDetailId(u.id)}
                              className="block max-w-full truncate text-left text-foreground transition hover:text-gold"
                            >
                              {u.fullName}
                            </button>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email ?? `@${u.username}`}
                              {!u.emailVerified && u.email && (
                                <span className="ml-2 text-amber-300/80">
                                  chưa xác minh
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        {u.editable ? (
                          <select
                            aria-label={`Vai trò của ${u.fullName}`}
                            value={u.role}
                            disabled={dong.ban(u.id)}
                            onChange={(e) =>
                              void handleRole(u, e.target.value as AccountRole)
                            }
                            className="rounded-full border border-gold/30 bg-input/70 px-3 py-1 text-xs text-foreground outline-none focus:border-gold disabled:opacity-50"
                          >
                            {/* Vai trò hiện tại luôn có mặt, kể cả khi nằm ngoài
                                phạm vi được gán — nếu không, select sẽ hiện sai
                                vai trò của người đó. */}
                            {[
                              ...new Set<AccountRole>([
                                u.role,
                                ...assignableRoles,
                              ]),
                            ].map((r) => (
                              <option
                                key={r}
                                value={r}
                                disabled={!assignableRoles.includes(r)}
                                title={ROLE_DESCRIPTION[toAppRole(r)]}
                              >
                                {ROLE_LABEL_SHORT[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </td>

                      <td
                        className={`py-3 pr-3 text-xs ${STATUS_CLASS[u.status]}`}
                      >
                        {ACCOUNT_STATUS_LABEL[u.status]}
                      </td>

                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3 text-right">
                        {u.editable ? (
                          u.status === "BANNED" ? (
                            <button
                              type="button"
                              disabled={dong.ban(u.id)}
                              onClick={() => void handleStatus(u, "ACTIVE")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-40"
                            >
                              <Unlock
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                              Mở khoá
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={dong.ban(u.id)}
                              onClick={() => void handleStatus(u, "BANNED")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                            >
                              <UserX
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                              Khoá
                            </button>
                          )
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                            title="Bạn không có quyền sửa tài khoản này, hoặc đây là chính bạn"
                          >
                            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                            Không sửa được
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PagedList>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={query.data?.totalElements ?? 0}
        onChange={setPage}
        busy={query.isFetching}
        unit="tài khoản"
      />

      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70"
        />
        Đổi vai trò hoặc khoá tài khoản sẽ thu hồi mọi phiên đăng nhập của người
        đó — quyền nằm trong token đã cấp, không thu hồi thì token cũ vẫn dùng
        được tới khi hết hạn.
      </p>

      <UserDetailPanel userId={detailId} onClose={() => setDetailId(null)} />
      {creating && (
        <CreateUserDialog
          assignableRoles={assignableRoles}
          onClose={() => setCreating(false)}
        />
      )}
    </section>
  );
}

const ROLE_LABEL_SHORT: Record<AccountRole, string> = {
  USER: "Thành viên",
  STAFF: "Nhân viên",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DATE_FORMAT.format(d);
}
