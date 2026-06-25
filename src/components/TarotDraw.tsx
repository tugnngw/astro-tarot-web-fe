// src/components/TarotDraw.tsx
import { motion } from "framer-motion";
import { getCardMeaning } from "@/lib/mock-data";

interface Props {
  drawnCards: string[];
  revealed: boolean;
  onEnterChat: () => void;
}

export function TarotDraw({ drawnCards, revealed, onEnterChat }: Props) {
  // Nếu không có bài, hiển thị placeholder
  if (!drawnCards || drawnCards.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-muted-foreground">Đang rút bài...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 text-center">
      <h2 className="font-display text-2xl text-gold-soft">
        3 lá bài định mệnh của bạn
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        AI sẽ dự đoán sơ bộ trước khi vào trò chuyện.
      </p>
      <div className="mt-6 flex justify-center gap-4 flex-wrap">
        {drawnCards.map((c, i) => (
          <motion.div
            key={c + i}
            className="[perspective:1200px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <motion.div
              className="relative h-48 w-32 [transform-style:preserve-3d]"
              animate={{ rotateY: revealed ? 180 : 0 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
            >
              {/* Mặt sau */}
              <div className="absolute inset-0 grid place-items-center rounded-xl border border-gold/60 bg-gradient-to-br from-mystic to-card p-2 [backface-visibility:hidden] glow-mystic">
                <div className="text-3xl text-gold">✦</div>
              </div>
              {/* Mặt trước */}
              <div
                className="absolute inset-0 rounded-xl border border-gold bg-gradient-to-b from-card to-background p-2 [backface-visibility:hidden] glow-gold"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="flex h-full flex-col items-center justify-between py-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold">
                    {["Quá khứ", "Hiện tại", "Tương lai"][i] ||
                      `Vị trí ${i + 1}`}
                  </span>
                  <div className="text-4xl">🌙</div>
                  <span className="px-1 text-center font-display text-xs text-foreground">
                    {c}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-6 space-y-2 text-left text-sm"
        >
          {drawnCards.map((c, i) => (
            <div
              key={c}
              className="rounded-lg border border-gold/20 bg-card/40 p-3"
            >
              <span className="text-xs uppercase tracking-wider text-gold">
                {["Quá khứ", "Hiện tại", "Tương lai"][i] || `Vị trí ${i + 1}`} ·{" "}
                {c}
              </span>
              <p className="mt-1 text-muted-foreground">{getCardMeaning(c)}</p>
            </div>
          ))}
          <button
            onClick={onEnterChat}
            className="mt-4 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
          >
            ✦ Vào cuộc trò chuyện với AI
          </button>
        </motion.div>
      )}
    </div>
  );
}
