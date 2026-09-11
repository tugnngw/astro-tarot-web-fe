// Sổ cái ký quỹ của Reader.
//
// Bốn con số tổng ở trên (rút được, đang giữ, tổng nhận, tổng rút) không trả
// lời được câu hỏi mà Reader thật sự hỏi: "vì sao tháng này tôi nhận ít hơn?".
// Một khoản phạt vi phạm, một lần hoàn tiền cho khách, hay một lệnh rút đang
// giữ chỗ — cả ba đều làm số dư tụt mà không để lại dấu vết nào nhìn thấy
// được. Sổ cái là chỗ duy nhất nói ra điều đó.
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Minus, ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ESCROW_KIND_LABEL,
  getMyEscrowLedger,
  huongTien,
  type EscrowTransaction,
} from "@/api/money";
import { formatVND } from "@/lib/mock-data";
import { Pagination, PagedList } from "@/components/Pagination";
import { ListError } from "@/components/ListError";
import { keepPreviousData } from "@tanstack/react-query";

function fmtLuc(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function SoCaiKyQuy() {
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["money", "escrow-ledger", page] as const,
    queryFn: () => getMyEscrowLedger(page),
    placeholderData: keepPreviousData,
  });

  const rows = q.data?.content ?? [];

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <ScrollText aria-hidden="true" className="h-5 w-5 text-gold" />
        Sổ thu chi
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Mọi khoản ra vào ví của bạn, mới nhất trước. Cột bên phải là số dư rút
        được ngay sau khoản đó.
      </p>

      {q.isError ? (
        <ListError
          error={q.error}
          onRetry={() => void q.refetch()}
          title="Không tải được sổ thu chi"
        />
      ) : q.isPending ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-mystic/10"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Chưa có khoản nào. Sổ sẽ có dòng đầu tiên khi khách thanh toán buổi
          xem của bạn.
        </p>
      ) : (
        <>
          <PagedList>
            <ul className="mt-4 space-y-2">
              {rows.map((t) => (
                <DongSo key={t.id} t={t} />
              ))}
            </ul>
          </PagedList>
          <Pagination
            page={page}
            totalPages={q.data?.totalPages ?? 1}
            totalElements={q.data?.totalElements ?? 0}
            onChange={setPage}
            busy={q.isFetching}
            unit="khoản"
          />
        </>
      )}
    </section>
  );
}

function DongSo({ t }: { t: EscrowTransaction }) {
  const huong = huongTien(t.kind);

  // Ba trạng thái chứ không phải hai. Những khoản chỉ động tới phần "đang giữ"
  // (khách vừa trả, hoặc hoàn lại cho khách) không làm số dư rút được nhúc
  // nhích; gán cho chúng một dấu cộng hay trừ là nói sai.
  const { Icon, mau, dau } =
    huong === "tang"
      ? { Icon: ArrowDownLeft, mau: "text-emerald-300", dau: "+" }
      : huong === "giam"
        ? { Icon: ArrowUpRight, mau: "text-destructive", dau: "−" }
        : { Icon: Minus, mau: "text-muted-foreground", dau: "" };

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/5 px-4 py-3">
      <div className="flex min-w-0 gap-3">
        <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${mau}`} />
        <div className="min-w-0">
          <p className="text-sm text-foreground">{ESCROW_KIND_LABEL[t.kind]}</p>
          {t.note && (
            <p className="mt-0.5 text-xs text-muted-foreground">{t.note}</p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {fmtLuc(t.createdAt)}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className={`font-display text-lg tabular-nums ${mau}`}>
          {dau}
          {formatVND(t.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Còn lại {formatVND(t.balanceAfter)}
        </p>
      </div>
    </li>
  );
}
