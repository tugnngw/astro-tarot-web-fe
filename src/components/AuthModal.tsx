import { useState, useEffect } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "register" | "forgot";

export function AuthModal() {
  const { authPrompt, closeAuth, openAuth, login, register } = useAuth();
  const open = authPrompt.open;
  const mode = open ? authPrompt.mode : null;
  if (!open || mode === "reader") return null;
  return (
    <Shell onClose={closeAuth}>
      {mode === "login" && <LoginForm onSwitch={openAuth} onClose={closeAuth} login={login} />}
      {mode === "register" && <RegisterForm onSwitch={openAuth} onClose={closeAuth} register={register} />}
      {mode === "forgot" && <ForgotForm onSwitch={openAuth} onClose={closeAuth} />}
    </Shell>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
        <button onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 text-muted-foreground hover:text-gold transition">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input {...props} className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 pl-10 text-sm outline-none transition focus:border-gold" />
    </div>
  );
}

function LoginForm({ onSwitch, onClose, login }: any) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ email?: string; pwd?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErr: typeof err = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) newErr.email = "Email không hợp lệ";
    if (pwd.length < 8) newErr.pwd = "Mật khẩu tối thiểu 8 ký tự";
    setErr(newErr);
    if (Object.keys(newErr).length) return;
    setLoading(true);
    try {
      await login(email, pwd);
      toast.success("Đăng nhập thành công ✦");
      onClose();
    } catch {
      toast.error("Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-3xl text-gradient-gold">Đăng nhập</h2>
      <p className="mt-1 text-sm text-muted-foreground">Kết nối với vũ trụ của bạn ✦</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          {err.email && <p className="mt-1 text-xs text-destructive">{err.email}</p>}
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={show ? "text" : "password"} placeholder="Mật khẩu" value={pwd} onChange={(e) => setPwd(e.target.value)} className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 pl-10 pr-10 text-sm outline-none focus:border-gold" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
          {err.pwd && <p className="mt-1 text-xs text-destructive">{err.pwd}</p>}
        </div>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-gold" /> Ghi nhớ đăng nhập</label>
          <button type="button" onClick={() => onSwitch("forgot")} className="text-gold hover:underline">Quên mật khẩu?</button>
        </div>
        <button disabled={loading} type="submit" className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60">
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        <button type="button" className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-background/40 py-3 text-sm transition hover:bg-gold/10">
          <span className="text-base">G</span> Tiếp tục với Google
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => onSwitch("register")} className="font-medium text-gold hover:underline">Đăng ký ngay</button>
        </p>
      </form>
    </>
  );
}

function RegisterForm({ onSwitch, onClose, register }: any) {
  // State form khớp đúng cột bảng `users` (full_name, email, phone, password_hash)
  const [f, setF] = useState({ full_name: "", email: "", phone: "", pwd: "", pwd2: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate phía client (BE sẽ validate lại theo CHECK constraint)
    const ne: Record<string, string> = {};
    if (!f.full_name.trim()) ne.full_name = "Vui lòng nhập họ tên";
    if (f.full_name.length > 255) ne.full_name = "Họ tên tối đa 255 ký tự";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) ne.email = "Email không hợp lệ";
    if (!/^[0-9]{9,11}$/.test(f.phone)) ne.phone = "Số điện thoại không hợp lệ";
    if (f.pwd.length < 8 || !/[A-Z]/.test(f.pwd) || !/[a-z]/.test(f.pwd) || !/[0-9]/.test(f.pwd))
      ne.pwd = "≥8 ký tự, có chữ hoa, thường, số";
    if (f.pwd !== f.pwd2) ne.pwd2 = "Mật khẩu xác nhận không khớp";
    setErr(ne);
    if (Object.keys(ne).length) return;
    setLoading(true);
    try {
      // Gửi đúng tên field theo schema: full_name (không phải name)
      await register({ full_name: f.full_name, email: f.email, phone: f.phone, password: f.pwd });
      toast.success("Tạo tài khoản thành công ✦");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-3xl text-gradient-gold">Đăng ký</h2>
      <p className="mt-1 text-sm text-muted-foreground">Khởi đầu hành trình huyền bí ✦</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {[
          { k: "full_name", icon: UserIcon, ph: "Họ và tên", type: "text" },
          { k: "email", icon: Mail, ph: "Email", type: "email" },
          { k: "phone", icon: Phone, ph: "Số điện thoại (9-11 số)", type: "tel" },
          { k: "pwd", icon: Lock, ph: "Mật khẩu", type: "password" },
          { k: "pwd2", icon: Lock, ph: "Xác nhận mật khẩu", type: "password" },
        ].map((it) => (
          <div key={it.k}>
            <Field icon={it.icon} type={it.type} placeholder={it.ph} value={(f as any)[it.k]} onChange={(e: any) => setF({ ...f, [it.k]: e.target.value })} />
            {err[it.k] && <p className="mt-1 text-xs text-destructive">{err[it.k]}</p>}
          </div>
        ))}
        <button disabled={loading} className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60">
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => onSwitch("login")} className="font-medium text-gold hover:underline">Đăng nhập</button>
        </p>
      </form>
    </>
  );
}

function ForgotForm({ onSwitch }: any) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [cd, setCd] = useState(0);

  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(cd - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  const sendOtp = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Email không hợp lệ");
    setCd(60);
    setStep(2);
    toast.success("Đã gửi OTP đến email của bạn");
  };

  return (
    <>
      <h2 className="font-display text-3xl text-gradient-gold">Quên mật khẩu</h2>
      <p className="mt-1 text-sm text-muted-foreground">Bước {step}/3</p>
      <div className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <Field icon={Mail} type="email" placeholder="Nhập email của bạn" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            <button onClick={sendOtp} className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold">Gửi mã OTP</button>
          </>
        )}
        {step === 2 && (
          <>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập mã OTP 6 số" maxLength={6} className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-gold" />
            <button onClick={() => otp.length === 6 ? setStep(3) : toast.error("OTP phải có 6 ký tự")} className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold">Xác nhận OTP</button>
            <button disabled={cd > 0} onClick={() => { setCd(60); toast.success("Đã gửi lại OTP"); }} className="w-full text-sm text-gold disabled:opacity-50">
              {cd > 0 ? `Gửi lại sau ${cd}s` : "Gửi lại OTP"}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <Field icon={Lock} type="password" placeholder="Mật khẩu mới" value={newPwd} onChange={(e: any) => setNewPwd(e.target.value)} />
            <button onClick={() => { if (newPwd.length < 8) return toast.error("≥8 ký tự"); toast.success("Đặt lại mật khẩu thành công ✦"); onSwitch("login"); }} className="w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold">Đặt lại mật khẩu</button>
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <button onClick={() => onSwitch("login")} className="text-gold hover:underline">← Quay lại đăng nhập</button>
        </p>
      </div>
    </>
  );
}
