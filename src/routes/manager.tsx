// Trang Quản lý (MANAGER): quản lý nhân sự và duyệt hồ sơ Reader.
//
// Cố ý KHÔNG có sản phẩm, đơn hàng hay doanh thu — theo phân công thì những
// phần đó thuộc ADMIN. Bày chúng ở đây rồi để nút trả 403 thì tệ hơn là không
// bày. Mỗi tab cũng chỉ hiện khi có đúng quyền tương ứng.
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { UserDirectory } from "@/features/admin/components/UserDirectory";
import { ReaderApplications } from "@/features/admin/components/ReaderApplications";
import { ReportQueue } from "@/features/money/components/AdminMoneyTables";
import { CatalogManager } from "@/features/shop/components/CatalogManager";
import { StaffSupportQueue } from "@/features/support/components/StaffSupportQueue";
import { useAuth } from "@/lib/auth-context";
import type { WorkspaceTab } from "@/components/WorkspaceShell";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Quản lý — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["STAFF_VIEW"]}>
      <ManagerWorkspace />
    </RoleGuard>
  ),
});

function ManagerWorkspace() {
  const { can } = useAuth();
  const tabs: WorkspaceTab[] = [];

  if (can("ADMIN_READERS_REVIEW")) {
    tabs.push({
      key: "applications",
      label: "Hồ sơ chờ duyệt",
      render: () => <ReaderApplications />,
    });
  }
  if (can("REPORT_REVIEW")) {
    tabs.push({
      key: "reports",
      label: "Báo cáo vi phạm",
      render: () => <ReportQueue />,
    });
  }
  if (can("SUPPORT_VIEW")) {
    // Quản lý có SUPPORT_VIEW nhưng không có SUPPORT_RESPOND: họ giám sát hàng
    // chờ chứ không trả lời khách. TicketThread tự ẩn ô trả lời khi thiếu
    // SUPPORT_RESPOND.
    tabs.push({
      key: "support",
      label: "Hàng chờ hỗ trợ",
      render: () => <StaffSupportQueue />,
    });
  }
  if (can("STAFF_MANAGE")) {
    tabs.push({
      key: "staff",
      label: "Nhân sự",
      render: () => (
        <UserDirectory
          title="Nhân sự và thành viên"
          description="Cất nhắc thành viên lên nhân viên, hoặc đưa nhân viên về lại thành viên. Tài khoản quản lý và quản trị viên chỉ xem được — đổi vai trò của họ là việc của quản trị viên."
          assignableRoles={["USER", "STAFF"]}
        />
      ),
    });
  }
  if (can("CATALOG_MANAGE")) {
    tabs.push({
      key: "catalog",
      label: "Gian hàng",
      render: () => <CatalogManager />,
    });
  }

  return (
    <WorkspaceShell
      title="Quản lý"
      subtitle="Điều chỉnh đội ngũ và xét duyệt hồ sơ xin làm Reader."
      tabs={tabs}
    />
  );
}
