import { motion } from "framer-motion";

interface Props {
  card?: string;
  isRevealed: boolean;
  delay?: number;
  label?: string;
}

export function TarotCard({ card, isRevealed, delay = 0, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className="[perspective:1200px]">
        <motion.div
          className="relative h-56 w-36 [transform-style:preserve-3d]"
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Back */}
          <div className="absolute inset-0 rounded-xl border border-gold/60 bg-gradient-to-br from-mystic to-card p-3 [backface-visibility:hidden] glow-mystic">
            <div className="flex h-full items-center justify-center rounded-lg border border-gold/40">
              <div className="text-center">
                <div className="text-3xl text-gold">✦</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gold-soft">
                  Astro Tarot
                </div>
                <div className="mt-2 text-2xl text-gold">☾</div>
              </div>
            </div>
          </div>
          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl border border-gold bg-gradient-to-b from-card to-background p-3 [backface-visibility:hidden] glow-gold"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col items-center justify-between rounded-lg border border-gold/30 py-3">
              <div className="text-[10px] uppercase tracking-widest text-gold">
                Major Arcana
              </div>
              <div className="text-5xl">🌙</div>
              <div className="px-2 text-center font-display text-sm leading-tight text-foreground">
                {card ?? "—"}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
