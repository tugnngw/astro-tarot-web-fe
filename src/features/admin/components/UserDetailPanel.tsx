import { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  Loader2,
  LogOut,
  MailCheck,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/RoleBadge";
import { ACCOUNT_STATUS_LABEL } from "@/api/admin";
import {
  useDeleteUser,
  useResendVerification,
  useRevokeSessions,
  useSendPasswordReset,
  useUpdateUserInfo,
  useUserDetail,
} from "@/features/admin/queries";
import { useAuth } from "@/lib/auth-context";
import { formatVND } from "@/lib/mock-data";

/**
 * Bảng chi tiết một tài khoản, trượt vào từ cạnh phải.
 *
 * Dùng panel thay vì trang riêng để người quản trị không mất chỗ đang đứng
 * trong danh sách: họ thường mở vài tài khoản liên tiếp để so, mà mỗi lần quay
 * lại là mất bộ lọc và số trang.
 */
export function UserDetailPanel({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { can } = useAuth();
  const query = useUserDetail(userId);
  const closeRef = useRef<HTMLButtonElement>(null);

  const updateInfo = useUpdateUserInfo();
  const revoke = useRevokeSessions();
  const reset = useSendPasswordReset();
  const resend = useResendVerification();
  const remove = useDeleteUser();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const user = query.data;

  // Mở tài khoản khác thì phải thoát chế độ sửa, nếu không form vẫn giữ dữ
  // liệu của người trước và bấm Lưu là ghi nhầm sang người này.
  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [userId]);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        phone: user.phone ?? "",
        city: user.city ?? "",
        address: user.address ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userId, onClose]);

  if (!userId) return null;

  const busy =
    updateInfo.isPending ||
    revoke.isPending ||
    reset.isPending ||
    resend.isPending ||
    remove.isPending;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác không thành công");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Đóng bảng chi tiết"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết tài khoản"
        className="panel-black relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gold/25 shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gold/20 bg-card/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg">
              {query.isPending
                ? "Đang tải…"
                : (user?.fullName ?? "Không tìm thấy")}
            </h2>
            {user && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? `@${user.username}`}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        {query.isPending ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-mystic/10"
              />
            ))}
          </div>
        ) : query.isError || !user ? (
          <p className="p-5 text-sm text-muted-foreground">
            {query.error instanceof Error
              ? query.error.message
              : "Không tải được thông tin tài khoản."}
          </p>
        ) : (
          <div className="flex flex-col gap-6 p-5">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-gold/30"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 place-items-center rounded-full bg-mystic/20 font-display text-xl text-gold"
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <span className="text-xs text-muted-foreground">
                  {ACCOUNT_STATUS_LABEL[user.status]}
                </span>
                {!user.emailVerified && (
                  <span className="text-xs text-amber-300">
                    chưa xác minh email
                  </span>
                )}
              </div>
            </div>

            {/* Số liệu hoạt động: trả lời câu "khoá người này thì ảnh hưởng gì" */}
            <section>
              <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-gold/70">
                Hoạt động
              </h3>
              <dl className="grid grid-cols-3 gap-2">
                <Stat
                  label="Phiên đang mở"
                  value={String(user.activeSessions)}
                />
                <Stat label="Đơn hàng" value={String(user.orderCount)} />
                <Stat label="Đã chi" value={formatVND(user.totalSpent)} />
              </dl>
              {(user.hasReaderProfile || user.hasPendingReaderApplication) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {user.hasReaderProfile
                    ? "Đang có hồ sơ Reader — hạ vai trò sẽ khiến họ không nhận booking được nữa."
                    : "Đang có hồ sơ xin làm Reader chờ duyệt."}
                </p>
              )}
            </section>

            {/* Thông tin liên hệ */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-gold/70">
                  Thông tin
                </h3>
                {user.editable && !editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
                  >
                    <Pencil aria-hidden="true" className="h-3 w-3" /> Sửa
                  </button>
                )}
              </div>

              {editing ? (
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await run(
                      () =>
                        updateInfo.mutateAsync({
                          userId: user.id,
                          payload: form,
                        }),
                      "Đã cập nhật thông tin",
                    );
                    setEditing(false);
                  }}
                >
                  <Field
                    label="Họ tên"
                    value={form.fullName}
                    onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                  />
                  <Field
                    label="Số điện thoại"
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  />
                  <Field
                    label="Thành phố"
                    value={form.city}
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                  <Field
                    label="Địa chỉ"
                    value={form.address}
                    onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs text-foreground/80 transition hover:border-gold/50"
                    >
                      Huỷ
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-full bg-gold px-4 py-1.5 text-xs font-medium text-primary-foreground transition disabled:opacity-40"
                    >
                      {updateInfo.isPending ? "Đang lưu…" : "Lưu"}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-1.5 text-sm">
                  <Row label="Tên đăng nhập" value={user.username} />
                  <Row label="Số điện thoại" value={user.phone} />
                  <Row label="Thành phố" value={user.city} />
                  <Row label="Địa chỉ" value={user.address} />
                  <Row label="Đăng nhập bằng" value={user.authProvider} />
                  <Row
                    label="Đăng nhập gần nhất"
                    value={formatDateTime(user.lastLoginAt)}
                  />
                  <Row
                    label="Tham gia"
                    value={formatDateTime(user.createdAt)}
                  />
                </dl>
              )}
            </section>

            {/* Quyền của vai trò hiện tại */}
            <section>
              <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-gold/70">
                Vai trò này được làm gì
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {user.permissions.map((p) => (
                  <li
                    key={p}
                    className="rounded border border-gold/20 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </section>

            {/* Thao tác */}
            {user.editable && (
              <section>
                <h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-gold/70">
                  Thao tác
                </h3>
                <div className="flex flex-col gap-2">
                  <Action
                    icon={KeyRound}
                    label="Gửi liên kết đặt lại mật khẩu"
                    hint="Không ai đặt mật khẩu hộ người khác — họ tự đặt qua email."
                    disabled={busy || !user.email}
                    onClick={() =>
                      run(
                        () => reset.mutateAsync(user.id),
                        "Đã gửi liên kết đặt lại mật khẩu",
                      )
                    }
                  />
                  {!user.emailVerified && (
                    <Action
                      icon={MailCheck}
                      label="Gửi lại mail xác minh"
                      hint="Tài khoản chưa xác minh thì chưa đăng nhập được."
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => resend.mutateAsync(user.id),
                          "Đã gửi lại mail xác minh",
                        )
                      }
                    />
                  )}
                  <Action
                    icon={LogOut}
                    label="Buộc đăng xuất mọi thiết bị"
                    hint={`Đang có ${user.activeSessions} phiên mở.`}
                    disabled={busy || user.activeSessions === 0}
                    onClick={() =>
                      run(
                        () => revoke.mutateAsync(user.id),
                        "Đã thu hồi mọi phiên",
                      )
                    }
                  />

                  {can("USERS_MANAGE") && (
                    <div className="mt-1 rounded-xl border border-destructive/30 p-3">
                      {confirmDelete ? (
                        <>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Xoá mềm{" "}
                            <strong className="text-foreground">
                              {user.fullName}
                            </strong>
                            . Đơn hàng và lịch sử của họ vẫn giữ nguyên, nhưng
                            tài khoản sẽ biến mất khỏi mọi danh sách và không
                            đăng nhập được nữa.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(false)}
                              className="rounded-full border border-mystic/50 px-3.5 py-1.5 text-xs"
                            >
                              Không xoá
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                await run(
                                  () => remove.mutateAsync(user.id),
                                  "Đã xoá tài khoản",
                                );
                                onClose();
                              }}
                              className="rounded-full bg-destructive px-3.5 py-1.5 text-xs text-destructive-foreground disabled:opacity-40"
                            >
                              {remove.isPending ? "Đang xoá…" : "Xoá tài khoản"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="inline-flex items-center gap-2 text-xs text-destructive hover:underline"
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          Xoá tài khoản
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {!user.editable && (
              <p className="text-xs text-muted-foreground">
                Bạn không sửa được tài khoản này — hoặc đây là chính bạn, hoặc
                vai trò của họ nằm ngoài phạm vi của bạn.
              </p>
            )}
          </div>
        )}

        {busy && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/40">
            <Loader2
              aria-hidden="true"
              className="h-6 w-6 animate-spin text-gold"
            />
            <span className="sr-only">Đang xử lý</span>
          </div>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/20 px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-base text-gold">{value}</dd>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-sm">{value || "—"}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
      />
    </label>
  );
}

function Action({
  icon: Icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: typeof KeyRound;
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-gold/20 px-3 py-2.5 text-left transition hover:border-gold/50 hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gold/20 disabled:hover:bg-transparent"
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <span>
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

/** Định dạng cố định vi-VN: để mặc định thì máy chủ và trình duyệt ra khác nhau. */
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DATE_TIME_FORMAT.format(d);
}
