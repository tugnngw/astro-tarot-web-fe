import { motion } from "framer-motion";
import logo from "@/assets/logo-astrotarot.png";

export function MysticEye({ size = 420 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.13 85 / 0.4), transparent 65%)" }}
        animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={logo}
        alt="ASTROTAROT"
        className="relative h-full w-full object-contain"
        style={{ filter: "drop-shadow(0 0 30px oklch(0.78 0.13 85 / 0.5))" }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
