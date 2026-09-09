// Trang Quản trị (ADMIN): toàn quyền — tài khoản, phân quyền, tiền, hồ sơ
// Reader và sản phẩm liên kết.
//
// Bản đầu tiên của trang này chạy trên MOCK_USERS và số doanh thu bịa. Giờ mọi
// tab đều đọc dữ liệu thật.
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { UserDirectory } from "@/features/admin/components/UserDirectory";
import { ReaderApplications } from "@/features/admin/components/ReaderApplications";
import { ActivityLogTable } from "@/features/admin/components/ActivityLogTable";
import { CatalogManager } from "@/features/shop/components/CatalogManager";
import {
  PaymentQueue,
  PayoutQueue,
  ReportQueue,
} from "@/features/money/components/AdminMoneyTables";
import { ROLE_DESCRIPTION, APP_ROLES, ROLE_PERMISSIONS, ROLE_LABEL } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["USERS_MANAGE"]}>
      <AdminWorkspace />
    </RoleGuard>
  ),
});

function AdminWorkspace() {
  return (
    <WorkspaceShell
      title="Quản trị"
      subtitle="Toàn quyền trên tài khoản, tiền và sản phẩm liên kết."
      tabs={[
        {
          key: "users",
          label: "Tài khoản",
          render: () => (
            <UserDirectory
              title="Toàn bộ tài khoản"
              description="Đặt được mọi vai trò, kể cả quản lý và quản trị viên. Bạn không tự đổi vai trò hay tự khoá tài khoản của mình — chính điều đó bảo đảm hệ thống luôn còn ít nhất một quản trị viên."
              assignableRoles={["USER", "STAFF", "MANAGER", "ADMIN"]}
            />
          ),
        },
        {
          key: "applications",
          label: "Hồ sơ Reader",
          render: () => <ReaderApplications />,
        },
        {
          key: "payments",
          label: "Thanh toán",
          render: () => <PaymentQueue />,
        },
        {
          key: "payouts",
          label: "Rút tiền",
          render: () => <PayoutQueue />,
        },
        {
          key: "reports",
          label: "Báo cáo vi phạm",
          render: () => <ReportQueue />,
        },
        {
          key: "audit",
          label: "Nhật ký hệ thống",
          render: () => <ActivityLogTable />,
        },
        {
          key: "matrix",
          label: "Bảng phân quyền",
          render: () => <PermissionMatrix />,
        },
        {
          key: "commerce",
          label: "Sản phẩm liên kết",
          render: () => <CatalogManager />,
        },
      ]}
    />
  );
}

/**
 * Bảng vai trò × quyền.
 *
 * Có mặt ở đây vì phân quyền là thứ dễ hiểu sai nhất khi giao việc: người đi
 * cất nhắc cần nhìn thấy chính xác mình đang trao cái gì trước khi bấm.
 */
function PermissionMatrix() {
  const roles = APP_ROLES;
  const allPermissions = [
    ...new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r])),
  ];

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-xl">Vai trò làm được gì</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bảng này khớp với ánh xạ ở backend (CustomUserDetails). Sửa một bên thì
          phải sửa bên kia, nếu không giao diện sẽ hứa những thứ API từ chối.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gold/15">
                <th
                  scope="col"
                  className="py-2 pr-3 text-left text-xs font-normal uppercase tracking-[0.15em] text-muted-foreground"
                >
                  Quyền
                </th>
                {roles.map((r) => (
                  <th key={r} scope="col" className="px-2 py-2 text-center">
                    <RoleBadge role={r} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((p) => (
                <tr key={p} className="border-b border-white/5 last:border-0">
                  <th
                    scope="row"
                    className="py-2 pr-3 text-left font-normal text-muted-foreground"
                  >
                    <code className="text-[11px]">{p}</code>
                  </th>
                  {roles.map((r) => {
                    const has = ROLE_PERMISSIONS[r].includes(p);
                    return (
                      <td key={r} className="px-2 py-2 text-center">
                        <span
                          className={has ? "text-emerald-300" : "text-muted-foreground/30"}
                        >
                          {has ? "✓" : "—"}
                        </span>
                        <span className="sr-only">
                          {ROLE_LABEL[r]} {has ? "có" : "không có"} quyền {p}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-xl">Năm vai trò</h2>
        <dl className="mt-4 space-y-3">
          {roles.map((r) => (
            <div key={r} className="flex flex-wrap items-baseline gap-3">
              <dt className="w-32 shrink-0">
                <RoleBadge role={r} />
              </dt>
              <dd className="flex-1 text-sm text-muted-foreground">
                {ROLE_DESCRIPTION[r]}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Khách không phải một hàng trong bảng tài khoản — đó là trạng thái chưa
          đăng nhập, nên không ai gán được vai trò đó cho người khác.
        </p>
      </section>
    </div>
  );
}
