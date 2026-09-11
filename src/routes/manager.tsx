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
import { ReportQueue } from "@/features/money/components/AdminMoneyTables";
import { CatalogManager } from "@/features/shop/components/CatalogManager";
import { StaffSupportQueue } from "@/features/support/components/StaffSupportQueue";

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
          key: "reports",
          label: "Báo cáo vi phạm",
          render: () => <ReportQueue />,
        },
        {
          // Quản lý có SUPPORT_VIEW nhưng không có SUPPORT_RESPOND: họ giám
          // sát hàng chờ chứ không trả lời khách. Trước đây quyền này được cấp
          // mà khu của họ không có chỗ nào dùng tới, nên muốn xem thì phải
          // vòng sang /staff — trang của nhân viên. TicketThread tự ẩn ô trả
          // lời khi thiếu SUPPORT_RESPOND, nên ở đây chỉ là xem.
          key: "support",
          label: "Hàng chờ hỗ trợ",
          render: () => <StaffSupportQueue />,
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
        {
          // Gian hàng về tay Quản lý: chọn bán gì và viết mô tả là việc vận
          // hành, không phải việc tài chính. Quản trị viên vẫn giữ nguyên tab
          // này ở khu của mình — trao thêm cho Quản lý chứ không lấy đi của ai.
          key: "catalog",
          label: "Gian hàng",
          render: () => <CatalogManager />,
        },
      ]}
    />
  );
}
