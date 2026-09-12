import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { notificationLink, type Notification } from "@/api/notifications";
import {
  useDeleteNotifications,
  useDeleteReadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  usePinNotification,
  useUnreadCount,
} from "@/features/booking/queries";
import { useAuth } from "@/lib/auth-context";

/**
 * Chuông thông báo.
 *
 * Danh sách chỉ tải khi mở panel — con số trên chuông là thứ duy nhất phải hỏi
 * định kỳ, và nó là một endpoint riêng đúng vì lý do đó.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const boxRef = useRef<HTMLDivElement>(null);

  const unread = useUnreadCount(Boolean(user));
  const list = useNotifications(0, Boolean(user) && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const xoaDaDoc = useDeleteReadNotifications();
  const pin = usePinNotification();
  const xoaChon = useDeleteNotifications();

  const count = unread.data?.count ?? 0;
  const items = list.data?.content ?? [];
  const soTinDaDoc = items.filter((n) => n.read && !n.pinned).length;
  const coTheChon = items.filter((n) => !n.pinned);
  const daChonHet =
    coTheChon.length > 0 && coTheChon.every((n) => selected.has(n.id));

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Bỏ id đã biến mất khỏi danh sách (sau khi xoá / ghim).
  useEffect(() => {
    const ids = new Set(items.map((n) => n.id));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  if (!user) return null;

  function openItem(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    const to = notificationLink(n);
    setOpen(false);
    if (to) navigate({ to });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (daChonHet) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(coTheChon.map((n) => n.id)));
  }

  async function xoaDaChon() {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      const res = await xoaChon.mutateAsync(ids);
      setSelected(new Set());
      toast.success(
        res.deleted > 0
          ? `Đã xoá ${res.deleted} thông báo`
          : "Không xoá được tin đã ghim",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xoá được");
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `Thông báo, ${count} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-card/60 transition hover:border-gold"
      >
        <Bell aria-hidden="true" className="h-4 w-4 text-gold" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="panel-black absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-gold/30 shadow-2xl sm:w-96">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gold/20 px-4 py-2.5">
            <span className="text-sm font-medium">Thông báo</span>
            <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline disabled:opacity-50"
                >
                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Đánh dấu đã đọc
                </button>
              )}
              {soTinDaDoc > 0 && (
                <button
                  type="button"
                  onClick={() => xoaDaDoc.mutate()}
                  disabled={xoaDaDoc.isPending}
                  title="Xoá tin đã đọc. Tin đã ghim và tin chưa đọc giữ nguyên."
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Xoá đã đọc
                </button>
              )}
            </span>
          </div>

          {items.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={daChonHet}
                  disabled={coTheChon.length === 0}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 accent-[var(--gold)]"
                />
                Chọn tất cả
              </label>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => void xoaDaChon()}
                  disabled={xoaChon.isPending}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive transition hover:underline disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Xoá đã chọn ({selected.size})
                </button>
              )}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {list.isPending ? (
              <div className="space-y-2 p-3" aria-busy="true">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-mystic/10"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Chưa có thông báo nào.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-2 border-b border-white/5 px-3 py-2.5 last:border-0 ${
                      n.read ? "" : "bg-gold/[0.06]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      disabled={n.pinned}
                      title={
                        n.pinned
                          ? "Bỏ ghim trước khi chọn xoá"
                          : "Chọn để xoá"
                      }
                      onChange={() => toggleSelect(n.id)}
                      className="mt-1.5 h-3.5 w-3.5 shrink-0 accent-[var(--gold)] disabled:opacity-40"
                      aria-label={`Chọn: ${n.title}`}
                    />
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className="min-w-0 flex-1 text-left transition hover:opacity-90"
                    >
                      <span className="flex items-start gap-2">
                        {!n.read ? (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                          />
                        ) : (
                          <span className="mt-1.5 w-1.5 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground">
                            {n.title}
                          </span>
                          {n.message && (
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {n.message}
                            </span>
                          )}
                          <span className="mt-1 block text-[11px] text-muted-foreground/70">
                            {formatRelative(n.createdAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pin.mutate({ id: n.id, pinned: !n.pinned });
                      }}
                      disabled={pin.isPending}
                      title={n.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
                      aria-label={n.pinned ? "Bỏ ghim" : "Ghim"}
                      aria-pressed={n.pinned}
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition disabled:opacity-50 ${
                        n.pinned
                          ? "text-gold hover:bg-gold/10"
                          : "text-muted-foreground hover:bg-mystic/15 hover:text-gold"
                      }`}
                    >
                      <Star
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 ${n.pinned ? "fill-gold" : ""}`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** "5 phút trước" dễ đọc hơn dấu thời gian, nhưng quá một ngày thì ngày giờ rõ hơn. */
function formatRelative(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMinutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMinutes < 1) return "vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
  return DATE_FORMAT.format(d);
}
