// src/lib/auth-context.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import * as authApi from "@/api/auth";
import { ApiError, tokenStore } from "@/api/client";
import { getProfile } from "@/api/profile";
import {
  can as hasPermission,
  homePathFor,
  toAppRole,
  type Permission,
  type Role,
} from "@/lib/roles";
import type { User } from "@/api/types";

// Re-export để những chỗ cũ `import type { Role } from "@/lib/auth-context"`
// vẫn chạy; định nghĩa thật nằm ở @/lib/roles.
export type { Role };

export interface AuthUser {
  id: string;
  name: string;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: Role;
  /**
   * Quyền do BE cấp. Chỉ dùng để hiện/ẩn giao diện — sửa được ở localStorage
   * nên không được coi là hàng rào bảo mật, BE mới là chỗ chặn thật.
   */
  permissions: string[];
  joinedAt: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  /** Trả về email đã gửi mail xác minh; KHÔNG đăng nhập luôn. */
  register: (data: {
    email: string;
    full_name: string;
    password: string;
  }) => Promise<{ email: string; verificationEmailSent: boolean }>;
  logout: () => Promise<void>; // <-- Đổi thành Promise
  updateProfile: (
    patch: Partial<Omit<AuthUser, "id" | "role" | "joinedAt">>,
  ) => void;
  requestAuth: (cb: () => void) => void;
  /** Người đang đăng nhập có quyền này không. Chỉ để hiện/ẩn giao diện. */
  can: (permission: Permission) => boolean;
  /**
   * TRUE trong lúc đang đối chiếu phiên đăng nhập với BE lúc mở trang. Các
   * trang cần quyền phải chờ cờ này tắt rồi mới quyết định đuổi người ra,
   * không thì reload trang quản trị sẽ bị đá về trang chủ.
   */
  bootstrapping: boolean;
  authPrompt:
    | { open: false }
    | { open: true; mode: "login" | "register" | "forgot" | "reader" };
  openAuth: (mode: "login" | "register" | "forgot" | "reader") => void;
  closeAuth: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "astrotarot_user_v2";

/**
 * Những trang chỉ phục vụ luồng xác thực. Đăng nhập xong mà vẫn đứng ở đây thì
 * không còn gì để làm, nên chuyển về trang chủ.
 */
const AUTH_ONLY_ROUTES = ["/reset-password", "/verify-email"];

function toAuthUser(u: User, permissions: string[]): AuthUser {
  return {
    id: u.id,
    name: u.full_name,
    full_name: u.full_name,
    username: u.username,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    avatar: u.avatar ?? undefined,
    role: toAppRole(u.role),
    permissions,
    joinedAt: u.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authPrompt, setAuthPrompt] = useState<AuthCtx["authPrompt"]>({
    open: false,
  });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  useEffect(() => {
    // Hiện tạm bản trong localStorage để trang không nháy trạng thái "chưa đăng
    // nhập", rồi hỏi lại BE để lấy vai trò và quyền hiện hành.
    let cached: AuthUser | null = null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) cached = JSON.parse(raw) as AuthUser;
    } catch {
      /* localStorage hỏng hoặc bị chặn — coi như chưa đăng nhập */
    }
    if (cached) setUser(cached);

    if (!cached || !tokenStore.getAccess()) {
      setBootstrapping(false);
      return;
    }

    // Vai trò trong localStorage là dữ liệu người dùng tự sửa được, và nó cũng
    // cũ đi khi quản trị viên đổi quyền của họ. Lấy lại từ BE mỗi lần mở trang:
    // token vẫn là thứ quyết định API trả gì, nhưng ít nhất giao diện không
    // hiện nhầm menu quản trị cho người vừa bị hạ quyền.
    let cancelled = false;
    getProfile()
      .then((p) => {
        if (cancelled) return;
        persist({
          ...cached,
          name: p.fullName,
          full_name: p.fullName,
          username: p.username,
          email: p.email ?? undefined,
          phone: p.phone ?? undefined,
          avatar: p.avatar ?? undefined,
          role: toAppRole(p.role),
          permissions: p.permissions ?? [],
          joinedAt: p.createdAt,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // 401 nghĩa là phiên đã hết hạn hoặc bị thu hồi (đổi mật khẩu, bị hạ
        // quyền, bị khoá) — dọn sạch. Lỗi mạng thì giữ nguyên bản cache, không
        // đá người dùng ra chỉ vì BE tạm không với tới được.
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          tokenStore.clear();
          persist(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Gửi thẳng email xuống BE. Bản cũ cắt lấy phần trước dấu @ để làm username
  // — từ khi BE đăng nhập bằng email thì cách đó luôn sai.
  const login: AuthCtx["login"] = async (email, password) => {
    const res = await authApi.login({ email: email.trim(), password });
    persist(toAuthUser(res.user, res.permissions));

    // Đóng modal ngay tại đây. Trước đây không ai đóng nó: hàm này chỉ đổi
    // route, nên đăng nhập xong người dùng nhìn thấy trang chủ với ô đăng nhập
    // vẫn phủ lên trên.
    setAuthPrompt({ open: false });

    // Đăng nhập xong thì Ở NGUYÊN trang đang đọc dở. Người dùng bấm đăng nhập
    // giữa chừng là để làm tiếp việc đang làm, đá họ sang trang khác là bắt họ
    // tự tìm đường quay lại.
    //
    // Trừ mấy trang chỉ tồn tại cho luồng xác thực: ở lại đó sau khi đăng nhập
    // thì chẳng còn gì để xem, nên về trang chủ đúng vai trò.
    if (AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p))) {
      navigate({
        to: homePathFor(toAuthUser(res.user, res.permissions)),
      });
    }
    if (pendingAction) {
      const a = pendingAction;
      setPendingAction(null);
      setTimeout(a, 100);
    }
  };

  /**
   * Đăng ký KHÔNG đăng nhập luôn: BE chỉ tạo tài khoản và gửi mail xác minh,
   * không cấp token. Trả kết quả về để giao diện hiện màn "kiểm tra hộp thư".
   */
  const register: AuthCtx["register"] = async (data) => {
    return authApi.register({
      email: data.email.trim(),
      full_name: data.full_name,
      password: data.password,
    });
  };

  // ============================================================
  // LOGOUT - Cập nhật: clear user, token, redirect về trang chủ
  // ============================================================
  const logout: AuthCtx["logout"] = async () => {
    // Đăng xuất là hành động CỤC BỘ: xoá token và user ngay lập tức. Trước đây
    // hàm này await authApi.logout() rồi mới persist(null) — mà backend trên
    // gói free có thể đang ngủ và mất tới một phút mới trả lời, nên người dùng
    // bấm "Đăng xuất", thấy toast báo thành công, nhưng vẫn ngồi nguyên trong
    // phiên cho tới khi BE tỉnh. Và persist(null) KHÔNG xoá token: chỉ gỡ user
    // khỏi localStorage. Token còn nguyên nên chỉ cần tải lại trang là phần
    // bootstrap thấy token, gọi /me và kéo tài khoản cũ trở lại.
    //
    // Gọi thu hồi phiên phía server ở chế độ tốt-nhất-có-thể: authApi.logout()
    // đọc refresh token ngay khi được gọi, trước các dòng xoá bên dưới, nên vẫn
    // gửi đúng token đi. KHÔNG await — hỏng hay chậm cũng không giữ người dùng
    // lại.
    authApi.logout().catch(() => {
      /* thu hồi phía server hỏng cũng mặc kệ, phía client đã sạch */
    });
    tokenStore.clear();
    persist(null);
    navigate({ to: "/" });
  };

  const updateProfile = (
    patch: Partial<Omit<AuthUser, "id" | "role" | "joinedAt">>,
  ) => {
    if (user) {
      persist({ ...user, ...patch });
    }
  };

  // useCallback không phải để tối ưu: RoleGuard gọi openAuth trong useEffect và
  // để openAuth trong deps. Nếu hàm được tạo mới mỗi lần render thì effect chạy
  // lại sau mỗi lần render, lại gọi openAuth, lại setState — vòng lặp không
  // dừng. Hậu quả thấy được: đăng nhập từ một trang có RoleGuard xong thì ô
  // đăng nhập mở lại ngay, vì effect còn đang chạy dở với user cũ (null).
  const openAuth = useCallback(
    (mode: "login" | "register" | "forgot" | "reader") =>
      setAuthPrompt({ open: true, mode }),
    [],
  );

  const closeAuth = useCallback(() => setAuthPrompt({ open: false }), []);

  const requestAuth = (cb: () => void) => {
    if (user) cb();
    else {
      setPendingAction(() => cb);
      setAuthPrompt({ open: true, mode: "login" });
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        requestAuth,
        can: (permission) => hasPermission(user, permission),
        bootstrapping,
        authPrompt,
        openAuth,
        closeAuth,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
