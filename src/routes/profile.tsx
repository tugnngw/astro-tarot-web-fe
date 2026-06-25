import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Hồ sơ — ASTROTAROT" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile, openAuth } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [edit, setEdit] = useState({ name: "", phone: "" });
  const [pwd, setPwd] = useState({ old: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (!user) {
      openAuth("login");
      navigate({ to: "/" });
    } else {
      setEdit({ name: user.name, phone: user.phone || "" });
    }
  }, [user]);

  if (!user) return null;

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Vui lòng chọn file ảnh");
    if (file.size > 2 * 1024 * 1024)
      return toast.error("Ảnh không vượt quá 2MB");
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
      toast.success("Cập nhật ảnh đại diện thành công ✦");
    };
    reader.onerror = () => toast.error("Không đọc được file");
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const name = edit.name.trim();
    const phone = edit.phone.trim();
    if (name.length < 2) return toast.error("Họ tên tối thiểu 2 ký tự");
    if (name.length > 50) return toast.error("Họ tên tối đa 50 ký tự");
    if (phone && !/^[0-9+\-\s()]{8,15}$/.test(phone))
      return toast.error("Số điện thoại không hợp lệ");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      updateProfile({ name, phone });
      toast.success("Cập nhật hồ sơ thành công ✦");
    } catch {
      toast.error("Không thể cập nhật — thử lại");
    } finally {
      setSaving(false);
    }
  };

  const changePwd = async () => {
    if (!pwd.old) return toast.error("Nhập mật khẩu hiện tại");
    if (pwd.new.length < 8)
      return toast.error("Mật khẩu mới tối thiểu 8 ký tự");
    if (!/[A-Za-z]/.test(pwd.new) || !/[0-9]/.test(pwd.new))
      return toast.error("Mật khẩu cần cả chữ và số");
    if (pwd.new !== pwd.confirm)
      return toast.error("Xác nhận mật khẩu không khớp");
    if (pwd.new === pwd.old)
      return toast.error("Mật khẩu mới phải khác mật khẩu cũ");
    setChangingPwd(true);
    await new Promise((r) => setTimeout(r, 700));
    setChangingPwd(false);
    toast.success("Đổi mật khẩu thành công ✦");
    setPwd({ old: "", new: "", confirm: "" });
  };

  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={50} />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-4xl text-gradient-gold">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin và bảo mật tài khoản
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="relative mx-auto h-24 w-24">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover ring-2 ring-gold/50"
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-full bg-gold text-3xl text-primary-foreground">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Đổi ảnh đại diện"
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border border-gold/50 bg-card text-gold transition hover:bg-gold hover:text-primary-foreground"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onAvatar}
                className="hidden"
              />
            </div>
            <div className="mt-4 font-display text-xl text-foreground">
              {user.name}
            </div>
            <span className="mt-2 inline-block rounded-full bg-gold/20 px-3 py-0.5 text-[10px] uppercase tracking-wider text-gold">
              <Shield className="mr-1 inline h-3 w-3" /> {user.role}
            </span>
            <div className="mt-4 space-y-2 text-left text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gold" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gold" /> {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gold" />{" "}
                {new Date(user.joinedAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-xl text-gold-soft">
                Thông tin cá nhân
              </h3>
              <div className="mt-4 grid gap-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Họ tên
                </label>
                <input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className="rounded-lg border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Số điện thoại
                </label>
                <input
                  value={edit.phone}
                  onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                  placeholder="0987 654 321"
                  className="rounded-lg border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <button
                  disabled={saving}
                  onClick={save}
                  className="mt-2 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-xl text-gold-soft">
                Đổi mật khẩu
              </h3>
              <div className="mt-4 grid gap-3">
                <input
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  value={pwd.old}
                  onChange={(e) => setPwd({ ...pwd, old: e.target.value })}
                  className="rounded-lg border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới (≥ 8 ký tự, gồm chữ & số)"
                  value={pwd.new}
                  onChange={(e) => setPwd({ ...pwd, new: e.target.value })}
                  className="rounded-lg border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                  className="rounded-lg border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <button
                  disabled={changingPwd}
                  onClick={changePwd}
                  className="rounded-full border border-gold/50 py-2.5 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-60"
                >
                  {changingPwd ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
