import { useId, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCreateUser } from "@/features/admin/queries";
import { ROLE_DESCRIPTION, toAppRole, type AccountRole } from "@/lib/roles";

const ROLE_LABEL_SHORT: Record<AccountRole, string> = {
  USER: "Thành viên",
  STAFF: "Nhân viên",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

/**
 * Tạo tài khoản nhân sự trực tiếp.
 *
 * Không có ô "mật khẩu" cho quản trị viên gõ: hệ thống sinh mật khẩu ngẫu
 * nhiên rồi gửi liên kết cho chính chủ tự đặt. Quản trị viên biết mật khẩu của
 * người khác là mất hẳn khả năng quy trách nhiệm cho thao tác đăng nhập.
 */
export function CreateUserDialog({
  assignableRoles,
  onClose,
}: {
  assignableRoles: AccountRole[];
  onClose: () => void;
}) {
  const formId = useId();
  const create = useCreateUser();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    role: assignableRoles[0] ?? "USER",
    markEmailVerified: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      next.email = "Email không hợp lệ";
    }
    if (!form.fullName.trim()) next.fullName = "Họ tên là bắt buộc";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await create.mutateAsync({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role as AccountRole,
        markEmailVerified: form.markEmailVerified,
      });
      toast.success(
        form.markEmailVerified
          ? "Đã tạo tài khoản và gửi liên kết đặt mật khẩu"
          : "Đã tạo tài khoản và gửi mail xác minh",
      );
      onClose();
    } catch (e2) {
      toast.error(
        e2 instanceof Error ? e2.message : "Không tạo được tài khoản",
      );
    }
  }

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
        aria-labelledby={`${formId}-title`}
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

        <h2 id={`${formId}-title`} className="font-display text-xl">
          Tạo tài khoản
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dùng khi cần lập tài khoản cho đồng nghiệp mà không bắt họ tự đăng ký
          rồi mới cất nhắc.
        </p>

        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              aria-invalid={Boolean(errors.email)}
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.email}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Họ tên</span>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              aria-invalid={Boolean(errors.fullName)}
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.fullName}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">
              Số điện thoại (tuỳ chọn)
            </span>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Vai trò</span>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as AccountRole }))
              }
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL_SHORT[r]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              {ROLE_DESCRIPTION[toAppRole(form.role)]}
            </span>
          </label>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={form.markEmailVerified}
              onChange={(e) =>
                setForm((f) => ({ ...f, markEmailVerified: e.target.checked }))
              }
              className="mt-1 h-4 w-4 accent-[var(--gold)]"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">
                Đánh dấu email đã xác minh
              </span>{" "}
              — dùng khi bạn ngồi cạnh người đó. Họ vẫn nhận liên kết để tự đặt
              mật khẩu.
              <br />
              Bỏ trống thì họ nhận mail xác minh như người tự đăng ký.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-mystic/50 px-4 py-2 text-sm text-foreground/80 transition hover:border-gold/50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground glow-gold transition disabled:opacity-40"
            >
              {create.isPending ? "Đang tạo…" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
