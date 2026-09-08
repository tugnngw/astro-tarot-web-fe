import { Star, Eye, Calendar, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

const READERS = [
  {
    id: "r1",
    name: "Huyền Linh",
    expertise: "Tarot · Tình duyên",
    desc: "Hơn 10 năm dẫn lối tâm hồn qua những lá bài cổ. Trực giác sắc bén, đồng cảm sâu sắc.",
    rating: 4.9,
    views: 18420,
    color: "#a78bfa",
    avatar: "🌙",
  },
  {
    id: "r2",
    name: "Minh Nguyệt",
    expertise: "Chiêm tinh · Sự nghiệp",
    desc: "Đọc vị các vì sao, kết nối định mệnh và lộ trình sự nghiệp cá nhân hoá.",
    rating: 4.8,
    views: 15230,
    color: "#67e8f9",
    avatar: "✨",
  },
  {
    id: "r1",
    name: "Bảo An",
    expertise: "Numerology · Healing",
    desc: "Chữa lành nội tâm thông qua thần số học và năng lượng vũ trụ.",
    rating: 5.0,
    views: 12100,
    color: "#facc15",
    avatar: "☉",
  },
];

export function TopReaders({ vertical = false }: { vertical?: boolean }) {
  const { requestAuth } = useAuth();

  if (vertical) {
    return (
      <div className="flex flex-col gap-3">
        {READERS.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ x: -3 }}
            className="glass group relative flex items-center gap-3 overflow-hidden rounded-xl p-3 transition"
            style={{ boxShadow: `0 0 30px -20px ${r.color}aa` }}
          >
            <div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-3xl transition group-hover:opacity-50"
              style={{ background: r.color }}
            />
            <div
              className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl"
              style={{
                background: `linear-gradient(135deg, ${r.color}33, transparent)`,
                border: `1.5px solid ${r.color}`,
                color: r.color,
                boxShadow: `0 0 16px ${r.color}55`,
              }}
            >
              {r.avatar}
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-base text-foreground">
                  {r.name}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] text-foreground/80">
                  <Star className="h-3 w-3 fill-gold text-gold" /> {r.rating}
                </span>
              </div>
              <div className="truncate text-[11px]" style={{ color: r.color }}>
                {r.expertise}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" /> {formatNumber(r.views)}
              </div>
            </div>
            <div className="relative flex shrink-0 flex-col gap-1.5">
              <Link
                to="/readers/$id"
                params={{ id: r.id }}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-gold/40 px-2.5 py-1 text-[10px] text-gold transition hover:bg-gold/10"
              >
                <UserCircle2 className="h-3 w-3" /> Hồ sơ
              </Link>
              <Link
                to="/readers/$id"
                params={{ id: r.id }}
                onClick={() =>
                  requestAuth(() => toast.success("Mở lịch của " + r.name))
                }
                className="inline-flex items-center justify-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-medium text-primary-foreground glow-gold transition hover:scale-105"
              >
                <Calendar className="h-3 w-3" /> Đặt lịch
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {READERS.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -6, scale: 1.02 }}
          className="glass group relative overflow-hidden rounded-2xl p-5 transition"
          style={{ boxShadow: `0 0 40px -20px ${r.color}aa` }}
        >
          <div
            className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-30 transition group-hover:opacity-60"
            style={{ background: r.color }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="grid h-14 w-14 place-items-center rounded-full text-2xl"
              style={{
                background: `linear-gradient(135deg, ${r.color}33, transparent)`,
                border: `1.5px solid ${r.color}`,
                color: r.color,
                boxShadow: `0 0 20px ${r.color}55`,
              }}
            >
              {r.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-display text-lg text-foreground">
                {r.name}
              </div>
              <div className="truncate text-xs" style={{ color: r.color }}>
                {r.expertise}
              </div>
            </div>
          </div>
          <p className="relative mt-3 line-clamp-2 text-sm text-muted-foreground">
            {r.desc}
          </p>
          <div className="relative mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />{" "}
              <span className="text-foreground font-medium">{r.rating}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatNumber(r.views)}
            </span>
          </div>
          <div className="relative mt-4 flex gap-2">
            <Link
              to="/readers/$id"
              params={{ id: r.id }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gold/40 px-3 py-2 text-xs text-gold transition hover:bg-gold/10"
            >
              <UserCircle2 className="h-3.5 w-3.5" /> Hồ sơ
            </Link>
            <Link
              to="/readers/$id"
              params={{ id: r.id }}
              onClick={() =>
                requestAuth(() => toast.success("Mở lịch của " + r.name))
              }
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gold px-3 py-2 text-xs font-medium text-primary-foreground glow-gold transition hover:scale-105"
            >
              <Calendar className="h-3.5 w-3.5" /> Book
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
