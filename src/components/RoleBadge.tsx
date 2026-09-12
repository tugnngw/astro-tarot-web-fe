import {
  ROLE_BADGE_CLASS,
  ROLE_LABEL,
  toAppRole,
  type Role,
} from "@/lib/roles";

/**
 * Chip vai trò. Dùng chung ở mọi nơi để một vai trò luôn có đúng một màu và
 * một tên tiếng Việt — người dùng nhận ra "Quản lý" qua màu tím ở bảng nhân sự
 * cũng như ở menu tài khoản.
 */
export function RoleBadge({
  role,
  className = "",
}: {
  /** Nhận cả role của giao diện ("staff") lẫn của BE ("STAFF"). */
  role: Role | string;
  className?: string;
}) {
  const appRole: Role = (ROLE_LABEL as Record<string, string>)[role]
    ? (role as Role)
    : toAppRole(role);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${ROLE_BADGE_CLASS[appRole]} ${className}`}
    >
      {ROLE_LABEL[appRole]}
    </span>
  );
}
