// ============================================================
// PHÂN QUYỀN PHÍA GIAO DIỆN
//
// ĐỌC KỸ: mọi thứ trong file này chỉ quyết định HIỂN THỊ. Nó không bảo vệ
// được gì cả — người dùng sửa localStorage hoặc gọi thẳng API là đi vòng qua
// hết. Chốt chặn thật nằm ở BE (@PreAuthorize + UserAdminServiceImpl). Ở đây
// chỉ để người dùng không phải nhìn những nút bấm vào sẽ nhận 403.
//
// Bảng ROLE_PERMISSIONS bên dưới là BẢN SAO của
// CustomUserDetails.ROLE_PERMISSIONS bên BE. Sửa một bên thì phải sửa bên kia.
// Khi đã đăng nhập, danh sách quyền lấy thẳng từ BE (trường `permissions` trong
// response đăng nhập và /api/v1/me) nên bản sao này chỉ dùng cho khách chưa
// đăng nhập và làm lưới an toàn khi BE cũ chưa trả `permissions`.
// ============================================================

/** Vai trò dùng trong giao diện. `guest` = chưa đăng nhập, không có trong DB. */
export const APP_ROLES = ["guest", "user", "staff", "manager", "admin"] as const;
export type Role = (typeof APP_ROLES)[number];

/** Vai trò có thật trong bảng users của BE. */
export type AccountRole = "USER" | "STAFF" | "MANAGER" | "ADMIN";

export type Permission =
  | "USER_BASIC"
  | "READER_APPLY"
  | "READER_MANAGE_PROFILE"
  | "SUPPORT_VIEW"
  | "SUPPORT_RESPOND"
  | "STAFF_VIEW"
  | "STAFF_MANAGE"
  | "ADMIN_READERS_VIEW"
  | "ADMIN_READERS_REVIEW"
  | "CATALOG_MANAGE"
  | "ORDERS_MANAGE"
  | "USERS_MANAGE";

/**
 * Vai trò cấp trên KHÔNG tự thừa kế quyền cấp dưới — giống hệt bên BE.
 * MANAGER không có SUPPORT_RESPOND vì quản lý giám sát chứ không trực tiếp trả
 * lời khách; ADMIN không có READER_APPLY vì admin không đi xin làm Reader.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  guest: [],
  user: ["USER_BASIC", "READER_APPLY"],
  staff: [
    "USER_BASIC",
    "READER_MANAGE_PROFILE",
    "SUPPORT_VIEW",
    "SUPPORT_RESPOND",
  ],
  manager: [
    "USER_BASIC",
    "SUPPORT_VIEW",
    "STAFF_VIEW",
    "STAFF_MANAGE",
    "ADMIN_READERS_VIEW",
    "ADMIN_READERS_REVIEW",
  ],
  admin: [
    "USER_BASIC",
    "READER_MANAGE_PROFILE",
    "SUPPORT_VIEW",
    "SUPPORT_RESPOND",
    "STAFF_VIEW",
    "STAFF_MANAGE",
    "ADMIN_READERS_VIEW",
    "ADMIN_READERS_REVIEW",
    "CATALOG_MANAGE",
    "ORDERS_MANAGE",
    "USERS_MANAGE",
  ],
};

/** Đổi role của BE sang role giao diện. Không đăng nhập → guest. */
export function toAppRole(role: AccountRole | string | null | undefined): Role {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "MANAGER":
      return "manager";
    case "STAFF":
      return "staff";
    case "USER":
      return "user";
    default:
      // Gồm cả "READER" của bản cũ còn sót trong localStorage: coi như staff,
      // đúng với việc READER đã gộp vào STAFF ở BE.
      return role === "READER" ? "staff" : "guest";
  }
}

export function toAccountRole(role: Role): AccountRole | null {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "manager":
      return "MANAGER";
    case "staff":
      return "STAFF";
    case "user":
      return "USER";
    default:
      return null;
  }
}

/** Đối tượng tối thiểu để xét quyền — nhận null cho khách chưa đăng nhập. */
export interface Principal {
  role: Role;
  /** Do BE cấp. Thiếu thì rơi về bảng bản sao ở trên. */
  permissions?: readonly string[];
}

export function permissionsOf(principal: Principal | null): readonly string[] {
  if (!principal) return ROLE_PERMISSIONS.guest;
  // Ưu tiên danh sách của BE: nó là thứ thực sự quyết định API cho hay không.
  if (principal.permissions?.length) return principal.permissions;
  return ROLE_PERMISSIONS[principal.role] ?? ROLE_PERMISSIONS.guest;
}

export function can(
  principal: Principal | null,
  permission: Permission,
): boolean {
  return permissionsOf(principal).includes(permission);
}

export function canAny(
  principal: Principal | null,
  permissions: Permission[],
): boolean {
  const owned = permissionsOf(principal);
  return permissions.some((p) => owned.includes(p));
}

// ---------- Nhãn hiển thị ----------

export const ROLE_LABEL: Record<Role, string> = {
  guest: "Khách",
  user: "Thành viên",
  staff: "Nhân viên",
  manager: "Quản lý",
  admin: "Quản trị viên",
};

/** Mô tả ngắn dùng ở màn quản lý, để người chọn vai trò biết mình đang trao gì. */
export const ROLE_DESCRIPTION: Record<Role, string> = {
  guest: "Chưa đăng nhập. Xem được trang chủ, cửa hàng và danh sách Reader.",
  user: "Khách đã đăng ký: mua hàng, đặt lịch, xem bài, nộp hồ sơ làm Reader.",
  staff: "Hỗ trợ khách và nhận booking với vai trò Reader.",
  manager: "Quản lý nhân sự và duyệt hồ sơ Reader. Không đụng sản phẩm, đơn hàng.",
  admin: "Toàn quyền, gồm sản phẩm, đơn hàng và phân quyền tài khoản.",
};

/** Màu chip theo vai trò — dùng chung để một vai trò luôn có một màu. */
export const ROLE_BADGE_CLASS: Record<Role, string> = {
  guest: "border-muted-foreground/30 text-muted-foreground",
  user: "border-sky-400/40 text-sky-300",
  staff: "border-emerald-400/40 text-emerald-300",
  manager: "border-violet-400/45 text-violet-300",
  admin: "border-gold/50 text-gold",
};

// ---------- Điều hướng ----------
//
// Cố ý không có bảng "trang chủ theo vai trò": đăng nhập xong người dùng ở lại
// đúng trang họ đang đọc dở. Nhân viên vào khu vực của mình qua link trên
// header (WORKSPACE_NAV) khi họ muốn, chứ không bị đá sang đó.

// `as const` để giữ kiểu literal của `to`: TanStack Router nhờ đó bắt được
// đường dẫn gõ sai ngay lúc biên dịch. Khai báo `to: string` là mất kiểm tra đó.

/** Ba trụ cột của sản phẩm — khách chưa đăng nhập cũng thấy đủ. */
export const PUBLIC_NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/tarot", label: "Tarot AI" },
  { to: "/readers", label: "Reader" },
  { to: "/shop", label: "Shop" },
] as const;

/** Link khu vực làm việc, chỉ hiện với người có quyền tương ứng. */
export const WORKSPACE_NAV = [
  { to: "/staff", label: "Bàn làm việc", permission: "SUPPORT_VIEW" },
  { to: "/manager", label: "Quản lý", permission: "STAFF_VIEW" },
  { to: "/admin", label: "Quản trị", permission: "USERS_MANAGE" },
] as const satisfies readonly {
  to: string;
  label: string;
  permission: Permission;
}[];

export type WorkspaceNavItem = (typeof WORKSPACE_NAV)[number];

export function workspaceNavFor(
  principal: Principal | null,
): WorkspaceNavItem[] {
  return WORKSPACE_NAV.filter((item) => can(principal, item.permission));
}
