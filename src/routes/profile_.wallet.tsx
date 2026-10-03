import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  ArrowLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Calendar,
  RefreshCw,
  HelpCircle,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { walletApi, type WalletTransaction, type WalletTransactionType } from "@/api/wallet";
import { TopupModal } from "@/components/wallet/TopupModal";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

export const Route = createFileRoute("/profile_/wallet")({
  head: () => ({ meta: [{ title: "Ví ASTROTAROT — Số dư & Giao dịch" }] }),
  component: () => (
    <RoleGuard require={["USER_BASIC"]} disallowRoles={["admin"]}>
      <WalletPage />
    </RoleGuard>
  ),
});

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTxTypeMeta(type: WalletTransactionType) {
  switch (type) {
    case "TOPUP":
      return {
        label: "Nạp tiền ví",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        icon: ArrowDownLeft,
        isPositive: true,
      };
    case "BOOKING_REFUND":
      return {
        label: "Hoàn tiền lịch hẹn",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        icon: RotateCcw,
        isPositive: true,
      };
    case "AI_SUBSCRIPTION":
      return {
        label: "Gói cước AI",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        icon: Zap,
        isPositive: false,
      };
    case "BOOKING_PAYMENT":
      return {
        label: "Thanh toán lịch hẹn",
        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        icon: Calendar,
        isPositive: false,
      };
    case "ADMIN_ADJUSTMENT":
    default:
      return {
        label: "Hệ thống điều chỉnh",
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        icon: RefreshCw,
        isPositive: false,
      };
  }
}

function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [topupOpen, setTopupOpen] = useState(false);

  const walletQuery = useQuery({
    queryKey: ["user-wallet"],
    queryFn: walletApi.getMyWallet,
    enabled: !!user,
  });

  const txQuery = useQuery({
    queryKey: ["wallet-transactions", page],
    queryFn: () => walletApi.getTransactions(page, PAGE_SIZE),
    enabled: !!user,
  });

  const balance = walletQuery.data?.balance ?? 0;
  const transactions = txQuery.data?.content ?? [];
  const totalElements = txQuery.data?.totalElements ?? 0;
  const totalPages = txQuery.data?.totalPages ?? 1;

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
    void queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
  };

  return (
    <div className="relative min-h-screen pb-16">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Navigation & Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Hồ sơ cá nhân
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={walletQuery.isFetching || txQuery.isFetching}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${walletQuery.isFetching ? "animate-spin" : ""}`}
            />
            Cập nhật số dư
          </button>
        </div>

        {/* Hero Section: Balance Card & Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Main Balance Card */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-card/90 via-card/60 to-gold/10 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Ví cá nhân
                    </span>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      ASTROTAROT Wallet
                    </h2>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Số dư khả dụng hiện tại
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-gold tracking-tight">
                    {walletQuery.isLoading ? "---" : formatVND(balance)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-lg glow-gold transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  Nạp tiền qua VietQR
                </button>

                <Link
                  to="/profile/subscription"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground hover:border-gold/60 hover:text-gold transition"
                >
                  <Sparkles className="h-4 w-4 text-gold" />
                  Gói AI Tarot
                </Link>

                <Link
                  to="/readers"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground hover:border-gold/60 hover:text-gold transition"
                >
                  <Calendar className="h-4 w-4 text-gold" />
                  Đặt lịch Reader
                </Link>
              </div>
            </div>
          </div>

          {/* Quick info benefits */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/20 bg-card/60 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Bảo chứng thanh toán 100%
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    Khóa hai lớp an toàn, trừ tiền tức thì không phát sinh phí phụ trội.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gold/20 bg-card/60 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Hoàn tiền huỷ lịch tự động
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    Khi huỷ lịch hẹn hợp lệ, khoản tiền cọc sẽ được hoàn ngay vào số dư ví của bạn.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gold/20 bg-card/60 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 text-gold shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    VietQR PayOS tức thời
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    Quét mã QR từ mọi ứng dụng ngân hàng, tiền vào ví trong vài giây.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="rounded-3xl border border-gold/25 bg-card/50 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-gold" />
              <h3 className="font-display text-xl font-semibold text-foreground">
                Lịch sử biến động số dư
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Tổng cộng {totalElements} giao dịch
            </span>
          </div>

          {txQuery.isLoading ? (
            <div className="space-y-3 py-6" aria-busy="true">
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold">
                <Receipt className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Chưa có giao dịch nào
              </h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Khi bạn nạp tiền vào ví hoặc thanh toán dịch vụ Tarot, lịch sử biến động số dư sẽ hiển thị chi tiết tại đây.
              </p>
              <button
                type="button"
                onClick={() => setTopupOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground shadow glow-gold transition hover:opacity-95"
              >
                <Plus className="h-3.5 w-3.5" />
                Nạp tiền ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: WalletTransaction) => {
                const meta = getTxTypeMeta(tx.type);
                const TypeIcon = meta.icon;
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-background/40 p-4 transition hover:border-gold/30 hover:bg-background/60"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${meta.color}`}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                          {tx.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Thành công
                            </span>
                          ) : tx.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                              <Clock className="h-3 w-3" />
                              Đang xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                              <XCircle className="h-3 w-3" />
                              Thất bại
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-foreground truncate">
                          {tx.description || meta.label}
                        </p>

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span>{formatDate(tx.createdAt)}</span>
                          {tx.referenceId && (
                            <span className="font-mono text-[10px]">
                              Mã: {tx.referenceId}
                            </span>
                          )}
                          {tx.paymentMethod && (
                            <span className="rounded bg-white/5 px-1.5 py-0.2 text-[10px]">
                              {tx.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                      <span
                        className={`font-display text-base font-bold ${
                          meta.isPositive ? "text-emerald-400" : "text-foreground"
                        }`}
                      >
                        {meta.isPositive ? "+" : "-"}
                        {formatVND(tx.amount)}
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Số dư sau:{" "}
                        <strong className="text-foreground">
                          {formatVND(tx.balanceAfter)}
                        </strong>
                      </p>
                    </div>
                  </div>
                );
              })}

              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onChange={(newPage) => setPage(newPage)}
                busy={txQuery.isFetching}
                unit="giao dịch"
              />
            </div>
          )}
        </div>
      </main>

      <TopupModal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
