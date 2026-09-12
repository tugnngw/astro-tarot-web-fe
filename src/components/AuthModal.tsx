// src/components/AuthModal.tsx
import { useId, useState } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  MailCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import * as authApi from "@/api/auth";

type Mode = "login" | "register" | "forgot";

/** Cùng luật với @Email và @Size(min=8) ở BE, để báo lỗi ngay không phải đợi request. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

export function AuthModal() {
  const { authPrompt, closeAuth, openAuth, login, register } = useAuth();
  const open = authPrompt.open;
  const mode = open ? authPrompt.mode : null;
  if (!open || mode === "reader") return null;

  return (
    <Shell onClose={closeAuth}>
      {mode === "login" && <LoginForm onSwitch={openAuth} login={login} />}
      {mode === "register" && (
        <RegisterForm onSwitch={openAuth} register={register} />
      )}
      {mode === "forgot" && <ForgotForm onSwitch={openAuth} />}
    </Shell>
  );
}

function Shell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in-95"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-gold"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  error,
  trailing,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  label: string;
  error?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-lg border bg-input/60 px-4 py-3 pl-10 text-sm outline-none transition focus:border-gold ${
            trailing ? "pr-10" : ""
          } ${error ? "border-destructive" : "border-gold/30"}`}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-gold"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h2 className="font-display text-3xl text-gradient-gold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </>
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}

// ============================================================
// ĐĂNG NHẬP
// ============================================================
function LoginForm({
  onSwitch,
  login,
}: {
  onSwitch: (m: Mode) => void;
  login: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ email?: string; pwd?: string }>({});
  const [loading, setLoading] = useState(false);
  /** Hiện khi BE báo tài khoản chưa xác minh, kèm nút gửi lại mail. */
  const [unverified, setUnverified] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Email không hợp lệ";
    if (!pwd) next.pwd = "Vui lòng nhập mật khẩu";
    setErr(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setUnverified(false);
    try {
      await login(email, pwd);
      toast.success("Đăng nhập thành công");
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : "Đăng nhập thất bại";
      // BE trả nguyên văn câu này khi email chưa xác minh.
      if (msg.includes("chưa được xác minh")) setUnverified(true);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await authApi.resendVerification(email.trim());
      toast.success("Đã gửi lại email xác minh. Kiểm tra hộp thư nhé.");
    } catch {
      toast.error("Không gửi lại được, thử lại sau ít phút");
    }
  }

  return (
    <>
      <Heading title="Đăng nhập" subtitle="Kết nối với vũ trụ của bạn ✦" />

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field
          icon={Mail}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err.email}
        />
        <Field
          icon={Lock}
          label="Mật khẩu"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Mật khẩu"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          error={err.pwd}
          trailing={
            <PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />
          }
        />

        {unverified && (
          <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-foreground/90">
            Tài khoản này chưa xác minh email.{" "}
            <button
              type="button"
              onClick={resend}
              className="font-medium text-gold underline"
            >
              Gửi lại liên kết xác minh
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSwitch("forgot")}
            className="text-xs text-gold hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>

        <SubmitButton loading={loading}>Đăng nhập</SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={() => onSwitch("register")}
          className="font-medium text-gold hover:underline"
        >
          Đăng ký ngay
        </button>
      </p>
    </>
  );
}

// ============================================================
// ĐĂNG KÝ
// ============================================================
function RegisterForm({
  onSwitch,
  register,
}: {
  onSwitch: (m: Mode) => void;
  register: (p: {
    email: string;
    full_name: string;
    password: string;
  }) => Promise<{ email: string; verificationEmailSent: boolean }>;
}) {
  const [f, setF] = useState({
    email: "",
    full_name: "",
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  /** Sau khi đăng ký thành công thì đổi sang màn "kiểm tra hộp thư". */
  const [sentTo, setSentTo] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!f.full_name.trim()) next.full_name = "Vui lòng nhập họ tên";
    if (!EMAIL_RE.test(f.email.trim())) next.email = "Email không hợp lệ";
    if (f.password.length < MIN_PASSWORD)
      next.password = `Mật khẩu phải từ ${MIN_PASSWORD} ký tự`;
    if (f.confirm !== f.password) next.confirm = "Mật khẩu nhập lại không khớp";
    setErr(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await register({
        email: f.email,
        full_name: f.full_name,
        password: f.password,
      });
      setSentTo(res.email);
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return <CheckInbox email={sentTo} onSwitch={onSwitch} />;
  }

  return (
    <>
      <Heading title="Đăng ký" subtitle="Bắt đầu hành trình của bạn ✦" />

      <form onSubmit={submit} noValidate className="mt-6 space-y-3">
        <Field
          icon={UserIcon}
          label="Họ và tên"
          placeholder="Họ và tên"
          autoComplete="name"
          value={f.full_name}
          onChange={set("full_name")}
          error={err.full_name}
        />
        <Field
          icon={Mail}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={f.email}
          onChange={set("email")}
          error={err.email}
        />
        <Field
          icon={Lock}
          label="Mật khẩu"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={`Mật khẩu (tối thiểu ${MIN_PASSWORD} ký tự)`}
          value={f.password}
          onChange={set("password")}
          error={err.password}
          trailing={
            <PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />
          }
        />
        <Field
          icon={Lock}
          label="Nhập lại mật khẩu"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          value={f.confirm}
          onChange={set("confirm")}
          error={err.confirm}
        />

        <div className="pt-2">
          <SubmitButton loading={loading}>Tạo tài khoản</SubmitButton>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="font-medium text-gold hover:underline"
        >
          Đăng nhập
        </button>
      </p>
    </>
  );
}

/** Màn sau khi đăng ký: tài khoản chưa dùng được cho tới khi bấm link trong mail. */
function CheckInbox({
  email,
  onSwitch,
}: {
  email: string;
  onSwitch: (m: Mode) => void;
}) {
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await authApi.resendVerification(email);
      toast.success("Đã gửi lại email xác minh");
    } catch {
      toast.error("Không gửi lại được, thử lại sau ít phút");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10">
        <MailCheck aria-hidden="true" className="h-7 w-7 text-gold" />
      </div>
      <h2 className="mt-5 font-display text-2xl text-gradient-gold">
        Kiểm tra hộp thư
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Chúng tôi đã gửi liên kết xác minh tới{" "}
        <span className="text-foreground">{email}</span>. Bấm vào liên kết đó để
        kích hoạt tài khoản rồi quay lại đăng nhập.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Không thấy email? Kiểm tra cả mục Spam — liên kết có hạn 24 giờ.
      </p>

      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="mt-5 w-full rounded-full border border-gold/50 py-2.5 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-50"
      >
        {sending ? "Đang gửi..." : "Gửi lại email"}
      </button>
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className="mt-3 text-sm text-muted-foreground hover:text-gold"
      >
        Quay lại đăng nhập
      </button>
    </div>
  );
}

// ============================================================
// QUÊN MẬT KHẨU
// ============================================================
function ForgotForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setErr("Email không hợp lệ");
      return;
    }
    setErr(undefined);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      // BE cố ý luôn trả thành công dù email có tồn tại hay không, để trang
      // này không dùng được vào việc dò xem ai có tài khoản. Giao diện vì vậy
      // cũng hiển thị đúng một thông điệp.
      setSent(true);
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Không gửi được yêu cầu");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10">
          <MailCheck aria-hidden="true" className="h-7 w-7 text-gold" />
        </div>
        <h2 className="mt-5 font-display text-2xl text-gradient-gold">
          Đã gửi yêu cầu
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nếu <span className="text-foreground">{email.trim()}</span> có tài
          khoản tại Astrotarot, bạn sẽ nhận được liên kết đặt lại mật khẩu trong
          ít phút.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Liên kết có hạn 1 giờ và chỉ dùng được một lần.
        </p>
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="mt-5 w-full rounded-full border border-gold/50 py-2.5 text-sm text-gold transition hover:bg-gold/10"
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <>
      <Heading
        title="Quên mật khẩu"
        subtitle="Nhập email, chúng tôi sẽ gửi liên kết đặt lại ✦"
      />

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field
          icon={Mail}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email đã đăng ký"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err}
        />
        <SubmitButton loading={loading}>Gửi liên kết đặt lại</SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Nhớ ra rồi?{" "}
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="font-medium text-gold hover:underline"
        >
          Đăng nhập
        </button>
      </p>
    </>
  );
}
