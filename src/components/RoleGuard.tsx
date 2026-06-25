// ============================================================
// RoleGuard — bảo vệ trang theo role.
// Dùng ở các route admin / reader để chặn user không đúng vai trò.
// Lý do tách riêng: tránh lặp lại logic redirect ở từng route.
// ============================================================
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/auth-context";

interface Props {
  allow: Role[]; // danh sách role được phép vào
  children: ReactNode; // nội dung trang
  redirectTo?: string; // điểm đến khi từ chối (mặc định /)
}

export function RoleGuard({ allow, children, redirectTo = "/" }: Props) {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Chưa đăng nhập → mở modal login
    if (!user) {
      openAuth("login");
      return;
    }
    // Sai role → quay lại trang chủ + toast
    if (!allow.includes(user.role)) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate({ to: redirectTo });
    }
  }, [user, allow, navigate, openAuth, redirectTo]);

  // Render null trong lúc redirect để tránh nháy nội dung sai
  if (!user || !allow.includes(user.role)) return null;
  return <>{children}</>;
}
