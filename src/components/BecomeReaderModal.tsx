import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function BecomeReaderModal() {
  const { authPrompt, closeAuth } = useAuth();
  if (!authPrompt.open || authPrompt.mode !== "reader") return null;
  return <Form onClose={closeAuth} />;
}

function Form({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", expertise: "", years: "", bio: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success("Đã gửi đơn đăng ký chuyên gia ✦");
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-lg rounded-2xl p-8 animate-in zoom-in-95">
        <button onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 text-muted-foreground hover:text-gold">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display text-3xl text-gradient-gold">Đăng ký Chuyên gia</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chia sẻ trí tuệ — kết nối với hàng ngàn người tìm kiếm ánh sáng.</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input required placeholder="Họ và tên" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <input required type="tel" placeholder="Số điện thoại" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <input required placeholder="Chuyên môn (Tarot, Chiêm tinh, Numerology…)" value={f.expertise} onChange={(e) => setF({ ...f, expertise: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <input required type="number" min={0} placeholder="Số năm kinh nghiệm" value={f.years} onChange={(e) => setF({ ...f, years: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <textarea required rows={3} placeholder="Giới thiệu bản thân…" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold" />
          <button disabled={loading} className="rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60">
            {loading ? "Đang gửi..." : "Gửi đơn đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
