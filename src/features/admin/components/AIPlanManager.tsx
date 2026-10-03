import { useState } from "react";
import {
  useAllPlans,
  useCreatePlan,
  useUpdatePlan,
} from "@/features/admin/subscriptionQueries";
import type { SubscriptionPlan } from "@/api/subscription";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Plus, Pencil, Zap } from "lucide-react";

function formatVND(price: number): string {
  return price.toLocaleString("vi-VN") + " ₫";
}

const PLAN_TYPE_LABELS: Record<SubscriptionPlan["planType"], string> = {
  MONTHLY: "Tháng",
  DAY_PASS: "Ngày",
  FREE: "Miễn phí",
};

const PLAN_TYPE_COLORS: Record<SubscriptionPlan["planType"], string> = {
  MONTHLY: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  DAY_PASS: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  FREE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function AIPlanManager() {
  const { data: plans, isLoading } = useAllPlans();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="glass h-20 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-gold" />
            <div>
              <h2 className="font-display text-xl">Quản lý gói AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo, chỉnh sửa và quản lý các gói đăng ký AI cho người dùng.
              </p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90">
                <Plus className="h-4 w-4" />
                Tạo gói mới
              </button>
            </DialogTrigger>
            <DialogContent className="glass border-gold/20 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Tạo gói AI mới</DialogTitle>
              </DialogHeader>
              <CreatePlanForm
                onSuccess={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gold">{plans?.filter(p => p.isActive).length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Gói đang hoạt động</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{plans?.filter(p => !p.isActive).length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Gói đã tắt</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{plans?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Tổng số gói</p>
        </div>
      </div>

      {/* Plans table */}
      <section className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gold/15">
                <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">Tên gói</th>
                <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">Loại</th>
                <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-wider text-muted-foreground">Quota/ngày</th>
                <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-wider text-muted-foreground">Giá</th>
                <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-wider text-muted-foreground">Thời hạn</th>
                <th className="px-4 py-3 text-center text-xs font-normal uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">Mô tả</th>
                <th className="px-4 py-3 text-center text-xs font-normal uppercase tracking-wider text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {plans?.map((plan) => (
                <tr key={plan.id} className="border-b border-white/5 last:border-0 transition hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${PLAN_TYPE_COLORS[plan.planType]}`}>
                      {PLAN_TYPE_LABELS[plan.planType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3 text-gold" />
                      {plan.dailyQuota}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatVND(plan.price)}</td>
                  <td className="px-4 py-3 text-right">{plan.durationDays} ngày</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                      plan.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {plan.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground text-xs">{plan.description || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="inline-flex items-center gap-1 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold transition hover:bg-gold/10"
                    >
                      <Pencil className="h-3 w-3" />
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
              {(!plans || plans.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Chưa có gói nào. Bấm "Tạo gói mới" để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="glass border-gold/20 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Chỉnh sửa gói: {editingPlan?.name}</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <EditPlanForm
              plan={editingPlan}
              onSuccess={() => setEditingPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create form                                                         */
/* ------------------------------------------------------------------ */
function CreatePlanForm({ onSuccess }: { onSuccess: () => void }) {
  const createPlan = useCreatePlan();
  const [form, setForm] = useState({
    name: "",
    planType: "DAY_PASS" as "MONTHLY" | "DAY_PASS" | "FREE",
    dailyQuota: 5,
    price: 0,
    durationDays: 1,
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate(form, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Tên gói</label>
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="VD: Pro Monthly"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Loại gói</label>
        <select
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
          value={form.planType}
          onChange={(e) => setForm({ ...form, planType: e.target.value as typeof form.planType })}
        >
          <option value="MONTHLY" className="bg-background text-foreground">Tháng (Monthly)</option>
          <option value="DAY_PASS" className="bg-background text-foreground">Ngày (Day Pass)</option>
          <option value="FREE" className="bg-background text-foreground">Miễn phí (Free)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Quota/ngày</label>
          <input
            type="number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
            value={form.dailyQuota}
            onChange={(e) => setForm({ ...form, dailyQuota: Number(e.target.value) })}
            min={1}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Giá (VND)</label>
          <input
            type="number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Thời hạn (ngày)</label>
        <input
          type="number"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
          value={form.durationDays}
          onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
          min={1}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Mô tả</label>
        <textarea
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Mô tả ngắn gọn về gói..."
        />
      </div>
      {createPlan.isError && (
        <p className="text-sm text-red-400">Lỗi: {(createPlan.error as Error).message}</p>
      )}
      <button
        type="submit"
        disabled={createPlan.isPending || !form.name}
        className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-50"
      >
        {createPlan.isPending ? "Đang tạo..." : "Tạo gói"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Edit form                                                           */
/* ------------------------------------------------------------------ */
function EditPlanForm({
  plan,
  onSuccess,
}: {
  plan: SubscriptionPlan;
  onSuccess: () => void;
}) {
  const updatePlan = useUpdatePlan();
  const [form, setForm] = useState({
    dailyQuota: plan.dailyQuota,
    price: plan.price,
    isActive: plan.isActive,
    description: plan.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlan.mutate(
      { planId: plan.id, data: form },
      { onSuccess: () => onSuccess() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
        <span className="text-xs text-muted-foreground">Gói:</span>
        <span className="font-medium">{plan.name}</span>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${PLAN_TYPE_COLORS[plan.planType]}`}>
          {PLAN_TYPE_LABELS[plan.planType]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Quota/ngày</label>
          <input
            type="number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
            value={form.dailyQuota}
            onChange={(e) => setForm({ ...form, dailyQuota: Number(e.target.value) })}
            min={1}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Giá (VND)</label>
          <input
            type="number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Mô tả</label>
        <textarea
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold/50"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
        <span className="text-sm">Trạng thái hoạt động</span>
        <button
          type="button"
          onClick={() => setForm({ ...form, isActive: !form.isActive })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            form.isActive ? "bg-emerald-500" : "bg-white/20"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
              form.isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {updatePlan.isError && (
        <p className="text-sm text-red-400">Lỗi: {(updatePlan.error as Error).message}</p>
      )}
      <button
        type="submit"
        disabled={updatePlan.isPending}
        className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-50"
      >
        {updatePlan.isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
