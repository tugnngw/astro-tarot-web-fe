// Form khai và sửa một bản đồ sao.
//
// Trước đây chỉ có đường tạo duy nhất là lúc trải bài ở /tarot, và không có
// đường sửa nào cả: gõ nhầm giờ sinh thì phải xoá hồ sơ làm lại từ đầu. Mà
// giờ sinh sai một tiếng là cung Mọc đã khác — tức là toàn bộ phần "đọc theo
// bản đồ sao" mà trang chủ hứa hẹn đọc trên dữ liệu sai.
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { searchPlaces, type PlaceSuggestion } from "@/lib/geocode";
import { getUserTimezone } from "@/lib/utils";
import type {
  AstrologyProfile,
  ProfileType,
  CreateAstrologyProfileRequest,
} from "@/api/astrology";

const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  SELF: "Của tôi",
  OTHER: "Người khác",
  COUPLE: "Cặp đôi",
};

/** "HH:mm:ss" của BE → "HH:mm" cho input type=time, và ngược lại. */
const toHm = (t: string | null) => (t ? t.slice(0, 5) : "");
const toHms = (t: string) => (t ? `${t}:00` : "");

export function AstrologyProfileForm({
  profile,
  onSubmit,
  onCancel,
  submitting,
}: {
  /** Có hồ sơ = đang sửa; không có = tạo mới. */
  profile?: AstrologyProfile;
  onSubmit: (data: CreateAstrologyProfileRequest) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState(profile?.title ?? "");
  const [targetName, setTargetName] = useState(profile?.targetName ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [birthTime, setBirthTime] = useState(toHm(profile?.birthTime ?? null));
  const [birthPlace, setBirthPlace] = useState(profile?.birthPlace ?? "");
  const [lat, setLat] = useState<number | null>(profile?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(profile?.longitude ?? null);
  const [timezone, setTimezone] = useState(
    profile?.timezone ?? getUserTimezone(),
  );
  const [profileType, setProfileType] = useState<ProfileType>(
    profile?.profileType ?? "SELF",
  );
  const [isPrimary, setIsPrimary] = useState(profile?.isPrimary ?? false);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gõ nơi sinh thì tra toạ độ, nhưng chờ 500ms cho người ta gõ xong —
  // Nominatim giới hạn 1 request/giây, gọi theo từng phím là bị chặn.
  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function onPlaceChange(value: string) {
    setBirthPlace(value);
    // Sửa tên nơi sinh mà chưa chọn lại gợi ý thì toạ độ cũ không còn đúng.
    setLat(null);
    setLng(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      setSuggestions(await searchPlaces(value));
      setSearching(false);
    }, 500);
  }

  function pickPlace(s: PlaceSuggestion) {
    setBirthPlace(s.displayName);
    setLat(s.lat);
    setLng(s.lng);
    setSuggestions([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Đặt một tên cho hồ sơ này.");
    if (!birthDate) return setError("Chưa có ngày sinh.");
    if (!birthPlace.trim()) return setError("Chưa có nơi sinh.");
    // BE bắt buộc toạ độ (@NotNull). Khi sửa mà không đụng tới nơi sinh thì
    // toạ độ cũ vẫn còn; chỉ chặn khi người dùng gõ tên mới mà chưa chọn gợi ý.
    if (lat == null || lng == null) {
      return setError(
        "Chọn nơi sinh từ danh sách gợi ý để lấy đúng toạ độ — thiếu toạ độ thì không tính được bản đồ sao.",
      );
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      targetName: targetName.trim() || undefined,
      birthDate,
      birthTime: birthTime ? toHms(birthTime) : undefined,
      birthPlace: birthPlace.trim(),
      latitude: lat,
      longitude: lng,
      timezone: timezone || undefined,
      profileType,
      isPrimary,
    });
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl text-gold-soft">
          {profile ? "Sửa hồ sơ" : "Thêm hồ sơ mới"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          className="text-muted-foreground transition hover:text-gold"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Tên hồ sơ">
          <input
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bản đồ sao của tôi"
            className={inputCls}
          />
        </Field>

        <Field label="Hồ sơ của ai">
          <select
            value={profileType}
            onChange={(e) => setProfileType(e.target.value as ProfileType)}
            className={inputCls}
          >
            {(Object.keys(PROFILE_TYPE_LABEL) as ProfileType[]).map((t) => (
              <option key={t} value={t}>
                {PROFILE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tên người được xem">
          <input
            maxLength={100}
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="Không bắt buộc"
            className={inputCls}
          />
        </Field>

        <Field label="Múi giờ">
          <input
            maxLength={50}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Ngày sinh">
          <input
            required
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field
          label="Giờ sinh"
          hint="Không biết giờ thì để trống — chỉ là cung Mọc sẽ không chính xác."
        >
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="relative mt-3">
        <Field
          label="Nơi sinh"
          hint={
            lat != null && lng != null
              ? `Toạ độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : "Chọn một mục trong danh sách gợi ý để lấy toạ độ."
          }
        >
          <div className="relative">
            <input
              required
              maxLength={255}
              value={birthPlace}
              onChange={(e) => onPlaceChange(e.target.value)}
              placeholder="Gõ tên tỉnh/thành, ví dụ: Hải Phòng"
              className={inputCls}
              autoComplete="off"
            />
            {searching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />
            ) : (
              lat != null && (
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
              )
            )}
          </div>
        </Field>

        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gold/30 bg-card shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => pickPlace(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-gold/10"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span className="text-foreground/90">{s.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-gold,#d4af37)]"
        />
        Đặt làm hồ sơ chính — đây là bản đồ sao AI dùng khi bạn trải bài.
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gold/40 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
        >
          Huỷ
        </button>
        <button
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {profile ? "Lưu thay đổi" : "Tạo hồ sơ"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {hint && (
        <span className="text-[11px] text-muted-foreground/80">{hint}</span>
      )}
    </label>
  );
}
