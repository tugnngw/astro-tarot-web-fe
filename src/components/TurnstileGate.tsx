// Ô xác minh chống bot của Cloudflare, đặt trong các form đăng nhập/đăng ký.
//
// Không có site key thì component này KHÔNG vẽ gì cả và cũng không tải script.
// Đó là chủ ý: bật/tắt tính năng chỉ bằng một biến môi trường, và môi trường
// dev không bị chặn khi chưa cấu hình gì.
import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY, turnstileDangBat, turnstileStore } from "@/lib/turnstile";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

/** Tải script một lần cho cả trang, dù có bao nhiêu form cùng dùng. */
let dangTai: Promise<void> | null = null;
function taiScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (dangTai) return dangTai;
  dangTai = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      dangTai = null;
      reject(new Error("Không tải được Turnstile"));
    };
    document.head.appendChild(s);
  });
  return dangTai;
}

export function TurnstileGate() {
  const hop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!turnstileDangBat()) return;

    let huy = false;
    let widgetId: string | null = null;

    void taiScript()
      .then(() => {
        if (huy || !hop.current || !window.turnstile) return;
        widgetId = window.turnstile.render(hop.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          size: "flexible",
          callback: (t: string) => turnstileStore.set(t),
          "expired-callback": () => turnstileStore.set(null),
          "error-callback": () => turnstileStore.set(null),
        });
        // Token dùng một lần: sau khi lớp API tiêu thụ, xin ngay cái mới để
        // lần bấm nút thứ hai không hỏng vì lý do chẳng liên quan.
        turnstileStore.dangKyXinLai(() => {
          if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
        });
      })
      .catch(() => {
        // Script hỏng thì để trống — backend đang ở chế độ cho-qua-khi-hỏng.
        turnstileStore.set(null);
      });

    return () => {
      huy = true;
      turnstileStore.dangKyXinLai(null);
      turnstileStore.set(null);
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Widget đã bị gỡ cùng DOM — không có gì để dọn nữa.
        }
      }
    };
  }, []);

  if (!turnstileDangBat()) return null;

  return <div ref={hop} className="flex justify-center" />;
}
