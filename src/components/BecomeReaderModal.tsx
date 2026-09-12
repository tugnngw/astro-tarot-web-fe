// Đăng ký làm Reader.
//
// Trước đây form này chỉ chờ 900ms rồi hiện toast "đã gửi" — không gọi backend
// một lần nào. Người dùng tưởng đã nộp, quản trị viên không bao giờ thấy đơn.
// Giờ nó gọi thật POST /api/v1/readers/apply, và mở ra là đọc luôn đơn gần nhất
// để hiện trạng thái thay vì bắt điền lại từ đầu.
import { useEffect, useState } from "react";
import { X, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useApplyReader, useMyApplication } from "@/features/readers/queries";

export function BecomeReaderModal() {
  const { authPrompt, closeAuth } = useAuth();
  if (!authPrompt.open || authPrompt.mode !== "reader") return null;
  return <Panel onClose={closeAuth} />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Panel({ onClose }: { onClose: () => void }) {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  // Chỉ hỏi backend khi đã đăng nhập — gọi khi chưa có token chỉ tổ nhận 401.
  const application = useMyApplication(Boolean(user));

  // Chưa đăng nhập thì không có gì để nộp: đưa thẳng sang form đăng nhập.
  if (!user) {
    return (
      <Shell onClose={onClose} title="Đăng ký làm Reader">
        <p className="mt-1 text-sm text-muted-foreground">
          Bạn cần đăng nhập trước khi gửi đơn đăng ký.
        </p>
        <button
          onClick={() => openAuth("login")}
          className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
        >
          Đăng nhập
        </button>
      </Shell>
    );
  }

  if (application.isLoading) {
    return (
      <Shell onClose={onClose} title="Đăng ký làm Reader">
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" />
          Đang kiểm tra đơn của bạn…
        </div>
      </Shell>
    );
  }

  const app = application.data;

  if (app?.status === "PENDING") {
    return (
      <Shell onClose={onClose} title="Đơn đang chờ duyệt">
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div className="text-sm">
            <p className="text-foreground">
              Bạn đã gửi đơn ngày {fmtDate(app.createdAt)}. Quản trị viên sẽ xem
              và phản hồi qua thông báo trên trang.
            </p>
            {app.bio && (
              <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                {app.bio}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-gold/40 py-3 text-sm text-gold transition hover:bg-gold/10"
        >
          Đóng
        </button>
      </Shell>
    );
  }

  if (app?.status === "APPROVED") {
    return (
      <Shell onClose={onClose} title="Đơn đã được duyệt">
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-foreground">
            Bạn đã là Reader. Vào khu làm việc để đặt bảng giá và khai khung giờ
            rảnh — chưa có hai thứ đó thì khách không đặt lịch được.
          </p>
        </div>
        <button
          onClick={() => {
            onClose();
            navigate({ to: "/staff" });
          }}
          className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
        >
          Tới khu làm việc
        </button>
      </Shell>
    );
  }

  // Chưa nộp bao giờ, hoặc đơn cũ bị từ chối → cho điền (và nộp lại).
  return (
    <ApplyForm
      onClose={onClose}
      rejected={
        app?.status === "REJECTED"
          ? {
              reason: app.rejectionReason,
              bio: app.bio,
              experience: app.experience,
            }
          : null
      }
    />
  );
}

function ApplyForm({
  onClose,
  rejected,
}: {
  onClose: () => void;
  rejected: {
    reason: string | null;
    bio: string | null;
    experience: number | null;
  } | null;
}) {
  // Đơn bị từ chối thì điền sẵn nội dung cũ — bắt gõ lại từ đầu chỉ làm người ta
  // bỏ cuộc.
  const [bio, setBio] = useState(rejected?.bio ?? "");
  const [years, setYears] = useState(
    rejected?.experience != null ? String(rejected.experience) : "",
  );
  const [specialties, setSpecialties] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apply = useApplyReader();

  useEffect(() => setError(null), [bio, years, specialties]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    apply.mutate(
      {
        bio: bio.trim(),
        experience: years === "" ? 0 : Number(years),
        // "Tarot, Chiêm tinh" → ["Tarot", "Chiêm tinh"]; BE nhận mảng text[].
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi đơn đăng ký Reader ✦");
          onClose();
        },
        // Không toast thành công khi hỏng — đó chính là lỗi cũ của form này.
        onError: (err: unknown) =>
          setError(
            err instanceof Error
              ? err.message
              : "Không gửi được đơn. Thử lại sau.",
          ),
      },
    );
  };

  return (
    <Shell onClose={onClose} title="Đăng ký làm Reader">
      <p className="mt-1 text-sm text-muted-foreground">
        Chia sẻ trí tuệ — kết nối với những người đang tìm kiếm ánh sáng.
      </p>

      {rejected && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-foreground">
              Đơn trước chưa được duyệt
            </p>
            <p className="mt-1 text-muted-foreground">
              {rejected.reason?.trim() || "Không có lý do cụ thể."}
            </p>
            <p className="mt-1 text-muted-foreground">
              Bạn có thể chỉnh lại nội dung bên dưới và gửi lại.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-3">
        <textarea
          required
          rows={5}
          maxLength={2000}
          placeholder="Giới thiệu bản thân: bạn đọc bài theo hướng nào, đã đồng hành với ai, vì sao muốn nhận khách ở đây…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <div className="-mt-1 text-right text-xs text-muted-foreground">
          {bio.length}/2000
        </div>
        <input
          placeholder="Thế mạnh, cách nhau bằng dấu phẩy (Tarot, Chiêm tinh, Thần số học…)"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />
        <input
          type="number"
          min={0}
          max={80}
          placeholder="Số năm kinh nghiệm"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          className="rounded-lg border border-gold/30 bg-input/60 px-4 py-3 text-sm outline-none focus:border-gold"
        />

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          disabled={apply.isPending || bio.trim().length === 0}
          className="mt-1 rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
        >
          {apply.isPending ? "Đang gửi…" : "Gửi đơn đăng ký"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-8 animate-in zoom-in-95"
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 text-muted-foreground hover:text-gold"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display text-3xl text-gradient-gold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
