import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/api/client";

/**
 * Banner khi Render (free) đang wake — tránh demo OC1 trông như “sập”.
 * Chỉ hiện khi /ping chậm hơn ~2.5s hoặc lỗi mạng tạm thời.
 */
export function BackendWarmBanner() {
  const [warming, setWarming] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const started = Date.now();

    async function ping() {
      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 70_000);
      try {
        const res = await fetch(`${API_BASE}/ping`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        clearTimeout(kill);
        if (cancelled) return;
        const elapsed = Date.now() - started;
        if (!res.ok || elapsed > 2500) {
          setWarming(true);
          timer = setInterval(() => {
            setSeconds(Math.round((Date.now() - started) / 1000));
          }, 1000);
        }
        if (res.ok) {
          setWarming(false);
          if (timer) clearInterval(timer);
        }
      } catch {
        clearTimeout(kill);
        if (cancelled) return;
        setWarming(true);
        timer = setInterval(() => {
          setSeconds(Math.round((Date.now() - started) / 1000));
        }, 1000);
        // Thử lại sau khi wake
        setTimeout(() => {
          if (!cancelled) void pingAgain();
        }, 3000);
      }
    }

    async function pingAgain() {
      try {
        const res = await fetch(`${API_BASE}/ping`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          setWarming(false);
          if (timer) clearInterval(timer);
        }
      } catch {
        if (!cancelled) setTimeout(() => void pingAgain(), 4000);
      }
    }

    void ping();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  if (!warming) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] border-b border-amber-400/30 bg-amber-950/95 px-4 py-2 text-center text-xs text-amber-100 backdrop-blur"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Máy chủ đang khởi động (gói free, ~30–60 giây)
        {seconds > 0 ? ` · ${seconds}s` : ""}. Đừng đóng tab — demo sẽ chạy
        tiếp khi sẵn sàng.
      </span>
    </div>
  );
}
