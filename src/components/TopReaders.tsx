import { Star, Calendar, UserCircle2, UserPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useReaders } from "@/features/readers/queries";
import type { ReaderProfile } from "@/api/reader";

/**
 * Reader nổi bật trên trang chủ.
 *
 * Bản trước chạy trên một mảng ba Reader viết cứng, kèm điểm 4.9 và "18.420
 * lượt xem" — số liệu bịa, đặt ngay ở chỗ dễ thấy nhất trang. Nay đọc từ
 * GET /api/v1/readers.
 *
 * Bỏ hẳn chỉ số "lượt xem": hệ thống không đo nó, nên không có cách nào hiện
 * mà không bịa. Thay bằng điểm đánh giá và số năm kinh nghiệm — hai thứ có
 * thật trong hồ sơ.
 */

/**
 * Màu và ký hiệu gán theo thứ tự.
 *
 * Bản cũ dùng cyan #67e8f9 và vàng chanh #facc15 — hai màu bão hoà, lệch hẳn
 * khỏi tông vàng - tím của app. Ba tông dưới đây nằm trong họ tím - hổ phách -
 * xanh mực. Glyph chiêm tinh dạng chữ thay cho emoji: emoji render mỗi hệ điều
 * hành một kiểu và luôn có màu riêng, không nhuộm theo accent được.
 */
const ACCENTS = [
  { color: "#b9a2f0", glyph: "☾" },
  { color: "#9fb0dd", glyph: "✦" },
  { color: "#e0a154", glyph: "☉" },
  { color: "#c3a3d8", glyph: "☿" },
] as const;

const MAX_SHOWN = 4;

export function TopReaders({ vertical = false }: { vertical?: boolean }) {
  const query = useReaders();

  // Xếp theo điểm, Reader chưa có đánh giá xuống cuối — điểm 0 vì chưa ai chấm
  // không giống với điểm thấp vì bị chấm thấp.
  const readers = [...(query.data ?? [])]
    .sort((a, b) => {
      const ra = a.totalReviews ? Number(a.rating ?? 0) : -1;
      const rb = b.totalReviews ? Number(b.rating ?? 0) : -1;
      return rb - ra;
    })
    .slice(0, vertical ? 3 : MAX_SHOWN);

  if (query.isPending) {
    return (
      <div className={vertical ? "flex flex-col gap-3" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-4"}>
        {Array.from({ length: vertical ? 3 : MAX_SHOWN }, (_, i) => (
          <div
            key={i}
            className={`glass animate-pulse rounded-2xl ${vertical ? "h-20" : "h-56"}`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  // Chưa có Reader nào được duyệt thì mời người dùng ứng tuyển, thay vì bày ba
  // hồ sơ giả cho đỡ trống.
  if (readers.length === 0) {
    return (
      <div className="glass flex flex-col items-center rounded-2xl px-6 py-10 text-center">
        <UserPlus aria-hidden="true" className="h-9 w-9 text-gold/60" />
        <h3 className="mt-3 font-display text-lg">Cộng đồng Reader đang mở</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Chưa có Reader nào được duyệt. Nếu bạn đọc bài và muốn nhận lịch hẹn,
          hãy nộp hồ sơ — chúng tôi xét từng hồ sơ một.
        </p>
        <Link
          to="/readers"
          className="mt-4 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
        >
          Tìm hiểu thêm
        </Link>
      </div>
    );
  }

  if (vertical) {
    return (
      <div className="flex flex-col gap-3">
        {readers.map((r, i) => (
          <ReaderRow key={r.id} reader={r} accent={ACCENTS[i % ACCENTS.length]} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {readers.map((r, i) => (
        <ReaderCard key={r.id} reader={r} accent={ACCENTS[i % ACCENTS.length]} />
      ))}
    </div>
  );
}

type Accent = (typeof ACCENTS)[number];

function displayName(r: ReaderProfile) {
  return r.fullName ?? `@${r.username}`;
}

function expertise(r: ReaderProfile) {
  const specialties = r.specialties ?? [];
  if (specialties.length > 0) return specialties.slice(0, 2).join(" · ");
  return r.yearsExperience ? `${r.yearsExperience} năm kinh nghiệm` : "Reader mới";
}

function RatingBadge({ reader, className = "" }: { reader: ReaderProfile; className?: string }) {
  if (!reader.totalReviews) {
    return <span className={`text-muted-foreground ${className}`}>Chưa có đánh giá</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Star aria-hidden="true" className="h-3.5 w-3.5 fill-gold text-gold" />
      <span className="font-medium text-foreground">
        {Number(reader.rating ?? 0).toFixed(1)}
      </span>
      <span className="text-muted-foreground">({reader.totalReviews})</span>
    </span>
  );
}

function Avatar({ reader, accent, size }: { reader: ReaderProfile; accent: Accent; size: number }) {
  const style = {
    background: `linear-gradient(135deg, ${accent.color}33, transparent)`,
    border: `1.5px solid ${accent.color}`,
    color: accent.color,
    boxShadow: `0 0 ${size / 3}px ${accent.color}55`,
    height: size,
    width: size,
  };
  if (reader.avatar) {
    return (
      <img src={reader.avatar} alt="" style={style} className="shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span aria-hidden="true" style={style} className="grid shrink-0 place-items-center rounded-full text-2xl">
      {accent.glyph}
    </span>
  );
}

function ReaderRow({ reader, accent }: { reader: ReaderProfile; accent: Accent }) {
  return (
    <article
      className="glass group relative flex items-center gap-3 overflow-hidden rounded-xl p-3 transition hover:-translate-x-0.5"
      style={{ boxShadow: `0 0 30px -20px ${accent.color}aa` }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-3xl transition group-hover:opacity-50"
        style={{ background: accent.color }}
      />
      <Avatar reader={reader} accent={accent} size={48} />

      <div className="relative min-w-0 flex-1">
        <h3 className="truncate font-display text-base text-foreground">{displayName(reader)}</h3>
        <p className="truncate text-[11px]" style={{ color: accent.color }}>
          {expertise(reader)}
        </p>
        <RatingBadge reader={reader} className="mt-0.5 text-[10px]" />
      </div>

      <div className="relative flex shrink-0 flex-col gap-1.5">
        <Link
          to="/readers/$id"
          params={{ id: reader.id }}
          className="inline-flex items-center justify-center gap-1 rounded-full border border-gold/40 px-2.5 py-1 text-[10px] text-gold transition hover:bg-gold/10"
        >
          <UserCircle2 aria-hidden="true" className="h-3 w-3" /> Hồ sơ
        </Link>
        <Link
          to="/readers/$id"
          params={{ id: reader.id }}
          className="inline-flex items-center justify-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-medium text-primary-foreground glow-gold transition hover:scale-105"
        >
          <Calendar aria-hidden="true" className="h-3 w-3" /> Đặt lịch
        </Link>
      </div>
    </article>
  );
}

function ReaderCard({ reader, accent }: { reader: ReaderProfile; accent: Accent }) {
  return (
    <article
      className="card-hover glass group relative flex flex-col overflow-hidden rounded-2xl p-5"
      style={{ boxShadow: `0 0 40px -20px ${accent.color}aa` }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl transition group-hover:opacity-60"
        style={{ background: accent.color }}
      />
      <div className="relative flex items-center gap-3">
        <Avatar reader={reader} accent={accent} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg text-foreground">{displayName(reader)}</h3>
          <p className="truncate text-xs" style={{ color: accent.color }}>
            {expertise(reader)}
          </p>
        </div>
      </div>

      <p className="relative mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
        {reader.bio ?? "Reader chưa viết giới thiệu."}
      </p>

      <div className="relative mt-4 flex items-center justify-between text-xs">
        <RatingBadge reader={reader} />
        {reader.isAvailable === false ? (
          <span className="text-amber-300">tạm ngưng</span>
        ) : (
          <span className="text-emerald-300">đang nhận lịch</span>
        )}
      </div>

      <div className="relative mt-auto flex gap-2 pt-4">
        <Link
          to="/readers/$id"
          params={{ id: reader.id }}
          className="flex-1 rounded-full border border-gold/40 py-1.5 text-center text-xs text-gold transition hover:bg-gold/10"
        >
          Hồ sơ
        </Link>
        <Link
          to="/readers/$id"
          params={{ id: reader.id }}
          className="flex-1 rounded-full bg-gold py-1.5 text-center text-xs font-medium text-primary-foreground glow-gold transition hover:scale-105"
        >
          Đặt lịch
        </Link>
      </div>
    </article>
  );
}
