import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  Trash2,
  UserCircle2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import {
  useChangePassword,
  useProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "@/features/profile/queries";
import {
  GENDER_LABEL,
  avatarUrl,
  type Gender,
  type Profile,
} from "@/api/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Hồ sơ cá nhân — ASTROTAROT" }] }),
  component: ProfilePage,
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // khớp với giới hạn ở BE
const MIN_PASSWORD = 8;

function ProfilePage() {
  const { user, openAuth, updateProfile: syncLocalUser } = useAuth();
  const profileQuery = useProfile(Boolean(user));

  if (!user) {
    return (
      <Shell>
        <Panel>
          <UserCircle2
            aria-hidden="true"
            className="mx-auto h-12 w-12 text-gold/60"
          />
          <h1 className="mt-4 font-display text-2xl">Đăng nhập để xem hồ sơ</h1>
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            Đăng nhập
          </button>
        </Panel>
      </Shell>
    );
  }

  if (profileQuery.isPending) {
    return (
      <Shell>
        <div className="space-y-4" aria-busy="true">
          <div className="glass h-40 animate-pulse rounded-2xl" />
          <div className="glass h-72 animate-pulse rounded-2xl" />
        </div>
      </Shell>
    );
  }

  if (profileQuery.isError) {
    return (
      <Shell>
        <Panel>
          <h1 className="font-display text-2xl">Không tải được hồ sơ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Có thể do mất kết nối tới máy chủ.
          </p>
          <button
            type="button"
            onClick={() => void profileQuery.refetch()}
            className="mt-5 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
          >
            Thử lại
          </button>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-3xl sm:text-4xl">
        Hồ sơ <span className="text-gradient-gold">cá nhân</span>
      </h1>

      <div className="mt-8 space-y-6">
        <AvatarCard profile={profileQuery.data} onSync={syncLocalUser} />
        <InfoForm profile={profileQuery.data} onSync={syncLocalUser} />
        <PasswordCard />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass mt-8 rounded-2xl px-6 py-16 text-center">
      {children}
    </div>
  );
}

// ============================================================
// ẢNH ĐẠI DIỆN
// ============================================================
function AvatarCard({
  profile,
  onSync,
}: {
  profile: Profile;
  onSync: (patch: { avatar?: string; name?: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const src = avatarUrl(profile.avatar);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Xoá value ngay để chọn lại đúng file vừa rồi vẫn kích hoạt onChange.
    e.target.value = "";
    if (!file) return;

    // Kiểm tra ngay tại client cho phản hồi tức thì; BE vẫn kiểm lại vì
    // client không phải chỗ tin được.
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chọn được file ảnh");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Ảnh không được lớn hơn 2MB");
      return;
    }

    try {
      const updated = await upload.mutateAsync(file);
      onSync({ avatar: avatarUrl(updated.avatar) ?? undefined });
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh thất bại");
    }
  }

  async function clear() {
    try {
      await remove.mutateAsync(undefined as never);
      onSync({ avatar: undefined });
      toast.success("Đã gỡ ảnh đại diện");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gỡ được ảnh");
    }
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {src ? (
            <img
              src={src}
              alt=""
              className="h-28 w-28 rounded-full border border-gold/40 object-cover"
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full border border-gold/40 bg-gold/10">
              <UserCircle2
                aria-hidden="true"
                className="h-14 w-14 text-gold/70"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Đổi ảnh đại diện"
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-gold text-primary-foreground transition hover:scale-105 disabled:opacity-50"
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={pick}
            className="hidden"
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-display text-2xl">{profile.fullName}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {profile.email}
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[10px] uppercase tracking-wider text-gold">
              {profile.role}
            </span>
            {profile.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 px-3 py-1 text-[10px] text-emerald-400">
                <ShieldCheck aria-hidden="true" className="h-3 w-3" /> Đã xác
                minh
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-destructive/50 px-3 py-1 text-[10px] text-destructive">
                <ShieldAlert aria-hidden="true" className="h-3 w-3" /> Chưa xác
                minh
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            JPEG, PNG, WEBP hoặc GIF, tối đa 2MB.
          </p>

          {profile.avatar && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-destructive disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Gỡ ảnh
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// THÔNG TIN CÁ NHÂN
// ============================================================
function InfoForm({
  profile,
  onSync,
}: {
  profile: Profile;
  onSync: (patch: { name?: string; phone?: string }) => void;
}) {
  const update = useUpdateProfile();

  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    gender: (profile.gender ?? "UNDISCLOSED") as Gender,
    dateOfBirth: profile.dateOfBirth ?? "",
    bio: profile.bio ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Đồng bộ lại khi hồ sơ từ server đổi (ví dụ vừa upload avatar xong thì
  // cache được ghi lại), nhưng chỉ khi người dùng chưa sửa dở dang.
  const dirty = useRef(false);
  useEffect(() => {
    if (dirty.current) return;
    setForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      gender: (profile.gender ?? "UNDISCLOSED") as Gender,
      dateOfBirth: profile.dateOfBirth ?? "",
      bio: profile.bio ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
      country: profile.country ?? "",
    });
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    dirty.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Vui lòng nhập họ tên";
    if (form.phone && !/^0[0-9]{9}$/.test(form.phone.trim()))
      next.phone = "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0";
    if (
      form.dateOfBirth &&
      form.dateOfBirth >= new Date().toISOString().slice(0, 10)
    )
      next.dateOfBirth = "Ngày sinh phải ở quá khứ";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const saved = await update.mutateAsync({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        // Chuỗi rỗng nghĩa là người dùng xoá ngày sinh -> gửi null để BE xoá,
        // gửi "" sẽ không parse được thành LocalDate.
        dateOfBirth: form.dateOfBirth || null,
        bio: form.bio.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
      });
      dirty.current = false;
      onSync({ name: saved.fullName, phone: saved.phone ?? undefined });
      toast.success("Đã lưu hồ sơ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu hồ sơ thất bại");
    }
  }

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl">Thông tin cá nhân</h2>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Họ và tên"
            value={form.fullName}
            onChange={(v) => set("fullName", v)}
            error={errors.fullName}
            autoComplete="name"
          />
          <TextField
            label="Số điện thoại"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            error={errors.phone}
            placeholder="0912345678"
            inputMode="tel"
            autoComplete="tel"
          />
          <SelectField
            label="Giới tính"
            value={form.gender}
            onChange={(v) => set("gender", v as Gender)}
            options={Object.entries(GENDER_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <TextField
            label="Ngày sinh"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
            error={errors.dateOfBirth}
          />
          <TextField
            label="Tỉnh / Thành phố"
            value={form.city}
            onChange={(v) => set("city", v)}
            autoComplete="address-level2"
          />
          <TextField
            label="Quốc gia"
            value={form.country}
            onChange={(v) => set("country", v)}
            autoComplete="country-name"
          />
        </div>

        <TextField
          label="Địa chỉ"
          value={form.address}
          onChange={(v) => set("address", v)}
          autoComplete="street-address"
        />

        <TextAreaField
          label="Giới thiệu bản thân"
          value={form.bio}
          onChange={(v) => set("bio", v)}
          maxLength={500}
          hint={`${form.bio.length}/500`}
        />

        <div className="rounded-xl border border-border/60 bg-input/40 p-3 text-xs leading-relaxed text-muted-foreground">
          Email <span className="text-foreground">{profile.email}</span> và tên
          đăng nhập <span className="text-foreground">{profile.username}</span>{" "}
          không sửa trực tiếp được ở đây. Email đổi qua luồng xác minh riêng để
          đảm bảo bạn thật sự sở hữu địa chỉ mới.
        </div>

        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}

// ============================================================
// ĐỔI MẬT KHẨU
// ============================================================
function PasswordCard() {
  const change = useChangePassword();
  const { logout } = useAuth();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!f.current) next.current = "Vui lòng nhập mật khẩu hiện tại";
    if (f.next.length < MIN_PASSWORD)
      next.next = `Mật khẩu mới phải từ ${MIN_PASSWORD} ký tự`;
    if (f.confirm !== f.next) next.confirm = "Mật khẩu nhập lại không khớp";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await change.mutateAsync({
        currentPassword: f.current,
        newPassword: f.next,
      });
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      // BE thu hồi mọi phiên khi đổi mật khẩu nên token hiện tại đã vô hiệu.
      // Đăng xuất luôn cho khớp, thay vì để người dùng bấm gì cũng lỗi 401.
      await logout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    }
  }

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <Lock aria-hidden="true" className="h-5 w-5 text-gold" /> Đổi mật khẩu
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Đổi xong, mọi thiết bị đang đăng nhập sẽ bị đăng xuất.
      </p>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <TextField
          label="Mật khẩu hiện tại"
          type="password"
          value={f.current}
          onChange={(v) => setF((p) => ({ ...p, current: v }))}
          error={errors.current}
          autoComplete="current-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={f.next}
            onChange={(v) => setF((p) => ({ ...p, next: v }))}
            error={errors.next}
            autoComplete="new-password"
          />
          <TextField
            label="Nhập lại mật khẩu mới"
            type="password"
            value={f.confirm}
            onChange={(v) => setF((p) => ({ ...p, confirm: v }))}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={change.isPending}
          className="rounded-full border border-gold/50 px-6 py-2.5 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-60"
        >
          {change.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}

// ============================================================
// Ô nhập dùng chung
// ============================================================
function TextField({
  label,
  value,
  onChange,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "id"
>) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 w-full rounded-xl border bg-input/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold ${
          error ? "border-destructive" : "border-gold/30"
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gold/30 bg-input/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <textarea
        id={id}
        rows={3}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full resize-none rounded-xl border border-gold/30 bg-input/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold"
      />
    </div>
  );
}
