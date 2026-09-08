import { useEffect, useRef, useState, type ReactNode } from "react";

/** Nếu observer không bắn trong khoảng này thì hiện nội dung luôn. */
const SAFETY_TIMEOUT_MS = 1200;

/**
 * Cho nội dung hiện dần lên khi cuộn tới.
 *
 * Trước đây trang chủ tạo nhịp bằng scroll-snap ép dừng mỗi 100vh — cách đó
 * giành quyền điều khiển cuộn của người dùng. Bỏ snap rồi thì mỗi phần cần
 * một tín hiệu nhẹ báo "đây là một khối mới"; hiện dần khi vào khung nhìn
 * làm được việc đó mà không đụng gì tới thao tác cuộn.
 *
 * Quan trọng: hiệu ứng trang trí KHÔNG được phép giấu mất nội dung. Dùng
 * whileInView của framer-motion thì nếu IntersectionObserver không bắn
 * (tab bị ẩn, trình duyệt cũ, hoặc trang chưa repaint) khối đó kẹt ở
 * opacity 0 vĩnh viễn — người dùng nhìn thấy một mảng trống. Nên ở đây
 * quan sát bằng tay và luôn có chốt thời gian: quá SAFETY_TIMEOUT_MS mà
 * chưa có tín hiệu thì hiện nội dung ra bất kể.
 *
 * Tôn trọng prefers-reduced-motion: người tắt hiệu ứng thấy nội dung ngay.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }

    const reveal = () => setShown(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      // amount nhỏ để khối cao hơn màn hình vẫn kịp hiện.
      { threshold: 0.15 },
    );
    observer.observe(el);

    const safety = window.setTimeout(reveal, SAFETY_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}s` : "0s" }}
      className={[
        className,
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
