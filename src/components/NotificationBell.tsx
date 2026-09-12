import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { notificationLink, type Notification } from "@/api/notifications";
import {
  useDeleteReadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
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
  const boxRef = useRef<HTMLDivElement>(null);

  const unread = useUnreadCount(Boolean(user));
  const list = useNotifications(0, Boolean(user) && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const xoaDaDoc = useDeleteReadNotifications();

  const count = unread.data?.count ?? 0;
  const items = list.data?.content ?? [];
  const soTinDaDoc = items.filter((n) => n.read).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // mousedown chứ không click: click nổ sau khi React đã render lại, và lúc
    // đó phần tử vừa bấm có thể không còn trong panel nữa.
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!user) return null;

  function openItem(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    const to = notificationLink(n);
    setOpen(false);
    if (to) navigate({ to });
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
        <div className="panel-black absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gold/30 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gold/20 px-4 py-2.5">
            <span className="text-sm font-medium">Thông báo</span>
            <span className="flex items-center gap-3">
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

              {/* Chỉ hiện khi thật sự có tin đã đọc để xoá. Một nút luôn hiện
                  mà bấm vào không làm gì là một nút nói dối. */}
              {soTinDaDoc > 0 && (
                <button
                  type="button"
                  onClick={() => xoaDaDoc.mutate()}
                  disabled={xoaDaDoc.isPending}
                  title="Xoá hẳn các thông báo đã đọc. Tin chưa đọc giữ nguyên."
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Xoá đã đọc
                </button>
              )}
            </span>
          </div>

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
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`block w-full border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-gold/5 ${
                        n.read ? "" : "bg-gold/[0.06]"
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        {!n.read && (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                          />
                        )}
                        <span className={n.read ? "pl-3.5" : ""}>
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
