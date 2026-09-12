// ============================================================
// RoleGuard — chặn trang theo QUYỀN, không theo tên vai trò.
//
// Chặn theo quyền vì mỗi lần thêm một vai trò mới mà chặn theo tên thì phải đi
// sửa lại `allow` ở từng route, sót một chỗ là thủng. Chặn theo quyền thì chỉ
// cần sửa bảng ánh xạ ở @/lib/roles và CustomUserDetails bên BE.
//
// Đây là hàng rào GIAO DIỆN, không phải hàng rào bảo mật: nó chỉ tránh cho
// người dùng nhìn thấy trang họ không dùng được. Dữ liệu thật vẫn do BE gác —
// mọi endpoint đều tự kiểm tra quyền.
// ============================================================
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { canAny, homePathFor, type Permission } from "@/lib/roles";

interface Props {
  /** Có ÍT NHẤT một trong các quyền này thì vào được. */
  require: Permission[];
  children: ReactNode;
  /** Điểm đến khi bị từ chối. Mặc định về trang chủ đúng vai trò. */
  redirectTo?: string;
}

export function RoleGuard({ require: required, children, redirectTo }: Props) {
  const { user, openAuth, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const allowed = canAny(user, required);
  const fallback = redirectTo ?? homePathFor(user);

  useEffect(() => {
    // Đang đối chiếu phiên với BE thì chưa kết luận gì. Bỏ qua bước này thì mỗi
    // lần F5 trang quản trị sẽ bị đá về trang chủ trước khi kịp biết mình là ai.
    if (bootstrapping) return;

    if (!user) {
      openAuth("login");
      return;
    }
    if (!allowed) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate({ to: fallback });
    }
  }, [user, allowed, bootstrapping, navigate, openAuth, fallback]);

  if (bootstrapping) {
    return (
      <div
        className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground"
        aria-busy="true"
      >
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }

  if (!user || !allowed) {
    // Nói rõ vì sao trang trống, thay vì để người dùng nhìn màn hình trắng
    // trong lúc chờ chuyển hướng.
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <ShieldAlert
            aria-hidden="true"
            className="mx-auto h-10 w-10 text-gold/60"
          />
          <h1 className="mt-4 font-display text-xl">Khu vực hạn chế</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "Tài khoản của bạn không có quyền vào trang này."
              : "Bạn cần đăng nhập để vào trang này."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
