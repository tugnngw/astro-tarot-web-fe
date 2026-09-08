// Trang Quản lý (MANAGER): quản lý nhân sự và duyệt hồ sơ Reader.
//
// Cố ý KHÔNG có sản phẩm, đơn hàng hay doanh thu — theo phân công thì những
// phần đó thuộc ADMIN. Bày chúng ở đây rồi để nút trả 403 thì tệ hơn là không
// bày.
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { UserDirectory } from "@/features/admin/components/UserDirectory";
import { ReaderApplications } from "@/features/admin/components/ReaderApplications";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Quản lý — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["STAFF_VIEW"]}>
      <ManagerWorkspace />
    </RoleGuard>
  ),
});

function ManagerWorkspace() {
  return (
    <WorkspaceShell
      title="Quản lý"
      subtitle="Điều chỉnh đội ngũ và xét duyệt hồ sơ xin làm Reader."
      tabs={[
        {
          key: "applications",
          label: "Hồ sơ chờ duyệt",
          render: () => <ReaderApplications />,
        },
        {
          key: "staff",
          label: "Nhân sự",
          render: () => (
            <UserDirectory
              title="Nhân sự và thành viên"
              description="Cất nhắc thành viên lên nhân viên, hoặc đưa nhân viên về lại thành viên. Tài khoản quản lý và quản trị viên chỉ xem được — đổi vai trò của họ là việc của quản trị viên."
              // Quản lý chỉ được đặt hai vai trò này. Danh sách gửi xuống đây
              // chỉ để dựng ô chọn; BE vẫn tự chặn lần nữa ở
              // UserAdminServiceImpl, nên sửa DOM cũng không lách được.
              assignableRoles={["USER", "STAFF"]}
            />
          ),
        },
      ]}
    />
  );
}
