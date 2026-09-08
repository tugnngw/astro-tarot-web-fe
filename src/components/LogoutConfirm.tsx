import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function LogoutConfirm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { logout } = useAuth();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in-95"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-2xl">
          ✦
        </div>
        <h3 className="mt-4 font-display text-2xl text-gradient-gold">
          Đăng xuất?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có chắc muốn kết thúc phiên này?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-gold/40 py-2.5 text-sm text-gold hover:bg-gold/10"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              logout();
              onClose();
              toast.success("Đăng xuất thành công");
            }}
            className="flex-1 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
