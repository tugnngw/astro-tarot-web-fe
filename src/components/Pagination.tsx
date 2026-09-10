// Điều khiển phân trang dùng chung cho mọi bảng.
//
// Trước đây các bảng nạp thẳng 50–100 dòng rồi đổ hết ra một lượt: trang dài
// vô tận, và bảng nào nhiều dữ liệu thì tải chậm dù người xem chỉ nhìn mươi
// dòng đầu.
//
// Hai điều kiện để sang trang không bị "nhảy":
//   1. Dùng `keepPreviousData` ở tầng query, để lúc chờ trang mới vẫn giữ
//      trang cũ trên màn hình thay vì rơi về khung xương rỗng.
//   2. Bọc phần danh sách trong <PagedList> để mọi trang cao bằng nhau —
//      trang cuối ít dòng hơn vẫn chiếm đúng chỗ, nên nút bấm không chạy lên.
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/** Số dòng mỗi trang, dùng chung để mọi bảng trông giống nhau. */
export const PAGE_SIZE = 10;

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
  busy = false,
  unit = "mục",
}: {
  /** Trang hiện tại, đếm từ 0 như BE. */
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
  /** Đang tải trang mới — khoá nút để không bấm dồn. */
  busy?: boolean;
  /** Danh từ đếm, ví dụ "giao dịch", "lịch hẹn". */
  unit?: string;
}) {
  // Một trang thì không có gì để đi tới — nhưng vẫn hiện tổng số, vì đó là
  // thông tin người dùng cần dù có phân trang hay không.
  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
      <p className="text-xs text-muted-foreground">
        {totalElements === 0
          ? `Không có ${unit} nào`
          : `${from}–${to} trên ${totalElements} ${unit}`}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={page === 0 || busy}
            onClick={() => onChange(page - 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-gold/50 hover:text-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {busy && <Loader2 className="h-3 w-3 animate-spin text-gold" />}
            Trang {page + 1}/{totalPages}
          </span>

          <button
            type="button"
            aria-label="Trang sau"
            disabled={page >= totalPages - 1 || busy}
            onClick={() => onChange(page + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-gold/50 hover:text-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Giữ chiều cao của vùng danh sách cố định giữa các trang.
 *
 * Trang cuối thường ít dòng hơn; nếu để tự co thì cả khối tụt lên và nút "Trang
 * sau" chạy khỏi chỗ ngón tay vừa bấm. `minRows` nhân với chiều cao một dòng ra
 * chiều cao tối thiểu, nên mọi trang chiếm đúng một khoảng như nhau.
 *
 * Dùng min-height chứ không phải height cố định: dòng nào nội dung dài hơn vẫn
 * giãn ra được thay vì bị cắt.
 */
export function PagedList({
  children,
  rows = PAGE_SIZE,
  rowHeight = 76,
}: {
  children: ReactNode;
  /** Số dòng của một trang đầy. */
  rows?: number;
  /** Chiều cao ước lượng của một dòng, tính bằng px. */
  rowHeight?: number;
}) {
  return <div style={{ minHeight: rows * rowHeight }}>{children}</div>;
}
