import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function ContactSection() {
  const [f, setF] = useState({ name: "", email: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Đã gửi tin nhắn — chúng tôi sẽ phản hồi sớm ✦");
    setF({ name: "", email: "", msg: "" });
    setLoading(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
          ✦ Liên hệ
        </div>
        <h3 className="mt-4 font-display text-4xl text-gradient-gold md:text-5xl">
          Liên hệ với chúng tôi
        </h3>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          Mọi câu hỏi, hợp tác hay phản hồi — ASTROTAROT luôn lắng nghe bạn dưới
          ánh sao.
        </p>

        <div className="mt-8 space-y-4">
          {[
            { ic: Mail, l: "Email", v: "hello@astrotarot.vn" },
            { ic: Phone, l: "Hotline", v: "1900 8868" },
            {
              ic: MapPin,
              l: "Địa chỉ",
              v: "Tầng 12, Tòa Mystic Tower, Q.1, TP. Hồ Chí Minh",
            },
          ].map(({ ic: Ic, l, v }) => (
            <div
              key={l}
              className="group flex items-start gap-4 rounded-xl border border-gold/20 bg-card/40 p-4 transition hover:border-gold/60 hover:bg-card/60"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-primary-foreground">
                <Ic className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {l}
                </div>
                <div className="mt-0.5 font-medium text-foreground">{v}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Theo dõi chúng tôi
          </div>
          <div className="mt-3 flex gap-3">
            {[Facebook, Instagram, Youtube, Twitter].map((Ic, i) => (
              <a
                key={i}
                href="#"
                className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold transition hover:scale-110 hover:border-gold hover:bg-gold hover:text-primary-foreground glow-gold"
              >
                <Ic className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="glass h-fit space-y-4 rounded-2xl p-8"
      >
        <h4 className="font-display text-2xl text-gradient-gold">
          Gửi tin nhắn
        </h4>
        <input
          required
          placeholder="Họ và tên"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <textarea
          required
          rows={5}
          placeholder="Nội dung..."
          value={f.msg}
          onChange={(e) => setF({ ...f, msg: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />{" "}
          {loading ? "Đang gửi..." : "Gửi tin nhắn"}
        </button>
      </motion.form>
    </div>
  );
}
