// Khu tự quản của Reader: bảng giá, khung giờ rảnh hàng tuần, ngày nghỉ.
//
// Ba thứ này quyết định Reader có nhận được khách hay không, nhưng trước đây
// backend có đủ endpoint mà giao diện không gọi tới một cái nào — Reader mới
// được duyệt sẽ ngồi im vì không có cách nào khai giá và lịch.
import { useState } from "react";
import {
  CalendarClock,
  CalendarOff,
  Loader2,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { formatVND } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { ReaderProfile } from "@/api/reader";
import {
  useAddUnavailableDate,
  useAvailability,
  useCreateAvailability,
  useDeleteAvailability,
  useDeleteUnavailableDate,
  useMyApplication,
  useMyReaderProfile,
  useUnavailableDates,
  useUpdateReaderProfile,
} from "../queries";

/**
 * BE quy ước dayOfWeek = java.time.DayOfWeek.getValue() % 7,
 * nên Chủ nhật là 0 và Thứ Bảy là 6 — không bao giờ có 7.
 */
const DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
] as const;

function errText(e: unknown, fallback: string) {
  if (e instanceof ApiError || e instanceof Error) return e.message || fallback;
  return fallback;
}

/** "08:00:00" → "08:00" cho input type=time. */
const toHm = (t: string) => t.slice(0, 5);

export function ReaderWorkspace() {
  const { openAuth } = useAuth();
  const profile = useMyReaderProfile();
  const application = useMyApplication();
  const availability = useAvailability();
  const daysOff = useUnavailableDates();

  if (profile.isPending) {
    return <div className="glass h-40 animate-pulse rounded-2xl" aria-busy="true" />;
  }

  // Được quản lý đặt thẳng làm Nhân viên thì chưa qua luồng nộp đơn, nên chưa
  // có ReaderProfile. Đó là trạng thái bình thường, không phải lỗi — và giờ có
  // lối đi tiếp: nộp đơn ngay tại đây. Trước kia màn này chỉ bảo "nhờ quản lý
  // tạo hồ sơ giúp" mà quản lý lại không có màn hình nào để tạo, nên ai rơi
  // vào đây là mắc kẹt vĩnh viễn.
  if (profile.isError) {
    const notFound =
      profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <section className="glass rounded-2xl px-5 py-8 text-center">
        <Star aria-hidden="true" className="mx-auto h-8 w-8 text-gold/50" />
        <h3 className="mt-3 font-display text-lg">
          {notFound ? "Bạn chưa có hồ sơ Reader" : "Không tải được hồ sơ Reader"}
        </h3>
        {notFound ? (
          <>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {application.data?.status === "PENDING"
                ? "Đơn của bạn đang chờ quản trị viên duyệt. Duyệt xong là hồ sơ Reader hiện ở đây."
                : "Hồ sơ Reader chỉ có sau khi đơn xin làm Reader được duyệt. Nộp đơn ngay bên dưới."}
            </p>
            {application.data?.status !== "PENDING" && (
              <button
                type="button"
                onClick={() => openAuth("reader")}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-sm font-medium text-background transition hover:bg-gold/90"
              >
                <Plus className="h-4 w-4" />
                {application.data?.status === "REJECTED"
                  ? "Nộp lại đơn"
                  : "Nộp đơn làm Reader"}
              </button>
            )}
          </>
        ) : (
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {errText(profile.error, "Lỗi không xác định.")}
          </p>
        )}
      </section>
    );
  }

  const p = profile.data;
  const slots = availability.data ?? [];
  const noPrice =
    p.pricePer15m == null && p.pricePer30m == null && p.pricePer60m == null;
  const noSlots = !availability.isPending && slots.length === 0;

  return (
    <div className="space-y-4">
      {/* Hai điều kiện này tách rời nhau: thiếu một cái là khách không đặt
          được, mà giao diện cũ không nói ra nên Reader không biết đường sửa. */}
      {(noPrice || noSlots) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Hồ sơ chưa đủ điều kiện nhận khách
            </p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {noPrice && <li>Chưa đặt giá cho buổi xem nào.</li>}
              {noSlots && <li>Chưa khai khung giờ rảnh nào trong tuần.</li>}
            </ul>
          </div>
        </div>
      )}

      <PricingEditor profile={p} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AvailabilityManager
          slots={slots}
          isPending={availability.isPending}
          isError={availability.isError}
        />
        <DaysOffManager
          dates={daysOff.data ?? []}
          isPending={daysOff.isPending}
          isError={daysOff.isError}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Giới thiệu, kinh nghiệm, bảng giá
// ------------------------------------------------------------

function PricingEditor({ profile }: { profile: ReaderProfile }) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [years, setYears] = useState(
    profile.yearsExperience != null ? String(profile.yearsExperience) : "",
  );
  const [specialties, setSpecialties] = useState(
    (profile.specialties ?? []).join(", "),
  );
  const [p15, setP15] = useState(numToStr(profile.pricePer15m));
  const [p30, setP30] = useState(numToStr(profile.pricePer30m));
  const [p60, setP60] = useState(numToStr(profile.pricePer60m));
  const update = useUpdateReaderProfile();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        bio: bio.trim(),
        yearsExperience: years === "" ? 0 : Number(years),
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        pricePer15m: strToNum(p15),
        pricePer30m: strToNum(p30),
        pricePer60m: strToNum(p60),
      },
      {
        onSuccess: () => toast.success("Đã lưu hồ sơ"),
        onError: (e) => toast.error(errText(e, "Không lưu được hồ sơ.")),
      },
    );
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="flex items-center gap-2 font-display text-lg">
        <Wallet aria-hidden="true" className="h-4 w-4 text-gold" />
        Hồ sơ và bảng giá
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Giá hiện lên trang công khai và là số tiền khách trả cho mỗi buổi. Để
        trống một mức nghĩa là bạn không nhận buổi có độ dài đó.
      </p>

      <form onSubmit={save} className="mt-4 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Giới thiệu</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bạn đọc bài theo hướng nào, khách thường tìm bạn vì điều gì…"
            className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">
              Thế mạnh (cách nhau bằng dấu phẩy)
            </span>
            <input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Tarot, Chiêm tinh, Thần số học"
              className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">
              Số năm kinh nghiệm
            </span>
            <input
              type="number"
              min={0}
              max={80}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <PriceInput label="15 phút" value={p15} onChange={setP15} />
          <PriceInput label="30 phút" value={p30} onChange={setP30} />
          <PriceInput label="60 phút" value={p60} onChange={setP60} />
        </div>

        <div className="flex justify-end">
          <button
            disabled={update.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-60"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu hồ sơ
          </button>
        </div>
      </form>
    </section>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const n = strToNum(value);
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step={1000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Chưa đặt giá"
        className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <span className="text-[11px] text-gold/80">
        {n != null ? formatVND(n) : "Không nhận buổi này"}
      </span>
    </label>
  );
}

const numToStr = (n: number | null) => (n == null ? "" : String(n));
const strToNum = (s: string) => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// ------------------------------------------------------------
// Khung giờ rảnh hàng tuần
// ------------------------------------------------------------

function AvailabilityManager({
  slots,
  isPending,
  isError,
}: {
  slots: { id: string; dayOfWeek: number; startTime: string; endTime: string }[];
  isPending: boolean;
  isError: boolean;
}) {
  const [day, setDay] = useState<number>(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const create = useCreateAvailability();
  const remove = useDeleteAvailability();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (start >= end) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    create.mutate(
      { dayOfWeek: day, startTime: `${start}:00`, endTime: `${end}:00` },
      {
        onSuccess: () => toast.success("Đã thêm khung giờ"),
        onError: (e) => toast.error(errText(e, "Không thêm được khung giờ.")),
      },
    );
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="flex items-center gap-2 font-display text-lg">
        <CalendarClock aria-hidden="true" className="h-4 w-4 text-gold" />
        Khung giờ rảnh hàng tuần
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Lịch lặp lại mỗi tuần. Hệ thống cắt các khung này thành slot theo độ dài
        buổi khách chọn.
      </p>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="text-[11px] text-muted-foreground">Ngày</span>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] text-muted-foreground">Từ</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] text-muted-foreground">Đến</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>
        <button
          disabled={create.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-60"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Thêm
        </button>
      </form>

      <div className="mt-5">
        {isPending ? (
          <div className="h-24 animate-pulse rounded-xl bg-mystic/10" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Không tải được lịch rảnh.
          </p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có khung giờ nào. Khách sẽ không thấy slot trống để đặt.
          </p>
        ) : (
          <ul className="space-y-3">
            {DAYS.filter((d) => slots.some((s) => s.dayOfWeek === d.value)).map(
              (d) => (
                <li key={d.value}>
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {d.label}
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {slots
                      .filter((s) => s.dayOfWeek === d.value)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 rounded-full border border-gold/25 py-1 pl-3 pr-1.5 text-sm"
                        >
                          <span className="text-foreground/90">
                            {toHm(s.startTime)}–{toHm(s.endTime)}
                          </span>
                          <button
                            type="button"
                            aria-label={`Xoá khung ${toHm(s.startTime)}–${toHm(s.endTime)} ${d.label}`}
                            disabled={remove.isPending}
                            onClick={() =>
                              remove.mutate(s.id, {
                                onSuccess: () => toast.success("Đã xoá khung giờ"),
                                onError: (e) =>
                                  toast.error(errText(e, "Không xoá được.")),
                              })
                            }
                            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Ngày nghỉ
// ------------------------------------------------------------

function DaysOffManager({
  dates,
  isPending,
  isError,
}: {
  dates: { id: string; unavailableDate: string; reason: string | null }[];
  isPending: boolean;
  isError: boolean;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const add = useAddUnavailableDate();
  const remove = useDeleteUnavailableDate();
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    add.mutate(
      { unavailableDate: date, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Đã báo ngày nghỉ");
          setDate("");
          setReason("");
        },
        onError: (e) => toast.error(errText(e, "Không thêm được ngày nghỉ.")),
      },
    );
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="flex items-center gap-2 font-display text-lg">
        <CalendarOff aria-hidden="true" className="h-4 w-4 text-gold" />
        Ngày nghỉ
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Ngày báo nghỉ sẽ không hiện slot nào, kể cả khi trùng khung giờ rảnh
        hàng tuần.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="text-[11px] text-muted-foreground">Ngày</span>
          <input
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="grid flex-1 gap-1">
          <span className="text-[11px] text-muted-foreground">
            Lý do (không bắt buộc)
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Việc riêng, đi xa…"
            className="w-full rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>
        <button
          disabled={add.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-60"
        >
          {add.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Thêm
        </button>
      </form>

      <div className="mt-5">
        {isPending ? (
          <div className="h-24 animate-pulse rounded-xl bg-mystic/10" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Không tải được danh sách ngày nghỉ.
          </p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa báo ngày nghỉ nào.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...dates]
              .sort((a, b) => a.unavailableDate.localeCompare(b.unavailableDate))
              .map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-foreground">
                      {new Date(d.unavailableDate).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                    {d.reason && (
                      <div className="truncate text-xs text-muted-foreground">
                        {d.reason}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Bỏ ngày nghỉ ${d.unavailableDate}`}
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(d.id, {
                        onSuccess: () => toast.success("Đã bỏ ngày nghỉ"),
                        onError: (e) => toast.error(errText(e, "Không xoá được.")),
                      })
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
