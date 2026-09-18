// Ô chọn ngày luôn hiện DD/MM/YYYY, bất kể máy người dùng đặt vùng nào.
//
// `<input type="date">` vẽ chữ theo locale của TRÌNH DUYỆT/HỆ ĐIỀU HÀNH, không
// theo `<html lang="vi">`. Máy để en-US thì ô ngày sinh hiện 09/18/2026, người
// Việt đọc thành ngày 9 tháng 18 — không có tháng 18 nên họ sẽ nhập lại cho
// "đúng" và ghi sai ngày sinh của chính mình. Không có thuộc tính HTML nào ép
// được định dạng này.
//
// Cách làm: giữ nguyên input native (để còn lịch hệ thống, còn gõ được năm xa
// như 1990 — thứ mà lịch bấm rất phiền), nhưng cho nó trong suốt và vẽ đè lớp
// chữ do mình định dạng. Giá trị vẫn là yyyy-mm-dd đúng như API cần.
//
// Ở sidebar đặt lịch KHÔNG dùng component này: chỗ đó chọn ngày trong hai tuần
// tới nên Popover + Calendar bấm được là hợp hơn. Ngày sinh thì ngược lại.
import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPLAY = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "2026-09-18" → "18/09/2026". Rỗng hoặc sai định dạng → "". */
export function formatIsoDateVi(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  // Ghép "T00:00:00" để Date hiểu là giờ ĐỊA PHƯƠNG. Thiếu nó thì chuỗi
  // yyyy-mm-dd bị đọc là UTC, và ai ở múi giờ âm sẽ thấy lùi một ngày.
  return DISPLAY.format(new Date(iso + "T00:00:00"));
}

type ViDateInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> & {
  /** yyyy-mm-dd — đúng dạng input native và API đang dùng. */
  value: string;
  onChange: (isoDate: string) => void;
};

export function ViDateInput({
  value,
  onChange,
  className,
  disabled,
  ...rest
}: ViDateInputProps) {
  const display = formatIsoDateVi(value);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none truncate",
          display ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {display || "dd/mm/yyyy"}
      </span>
      {/* Không có biểu tượng này thì ô trông y hệt một dòng chữ tĩnh —
          người dùng không biết là bấm được. */}
      <CalendarIcon
        aria-hidden="true"
        className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground"
      />
      <input
        {...rest}
        type="date"
        lang="vi"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
