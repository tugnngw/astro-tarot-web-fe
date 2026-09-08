import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/**
 * Vạch tiến trình cuộn mảnh ở đỉnh trang.
 *
 * Ngoài việc trang trí, nó trả lại thứ mà bản cũ đã lấy mất: bản cũ ẩn hẳn
 * scrollbar nên không còn cách nào biết mình đang ở đâu trong trang. Giờ
 * scrollbar đã hiện lại, vạch này là tín hiệu thứ hai, rõ và hợp chủ đề hơn.
 *
 * useSpring làm vạch chạy mượt thay vì giật theo từng nấc cuộn. Người bật
 * prefers-reduced-motion thì bám thẳng tiến trình, không nảy.
 */
export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX: reduceMotion ? scrollYProgress : smooth,
        transformOrigin: "0%",
        background:
          "linear-gradient(90deg, var(--mystic), var(--gold), var(--gold-soft))",
      }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left"
    />
  );
}
