import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Lời giải thích giấu sau một dấu hỏi nhỏ.
 *
 * ## Vì sao cần
 *
 * Trang quản trị từng in nguyên đoạn giải thích dưới mỗi khối — "cột này đếm
 * gì", "vì sao hai số không khớp", "vì sao Google không trả nguồn". Đúng
 * nhưng sai chỗ: người đọc cần con số, mà phải lướt qua ba dòng chữ mới tới.
 * Và đọc xong một lần rồi thì mỗi lần sau nó chỉ còn là rác thị giác.
 *
 * Nguyên tắc ở đây là **tiết lộ dần**: mặc định chỉ hiện thứ cần nhìn, phần
 * giải thích để sẵn cho ai muốn hỏi.
 *
 * ## Vì sao Popover chứ không Tooltip
 *
 * Tooltip chỉ hiện khi rê chuột. Trên điện thoại không có chuột, nên nội dung
 * ấy biến mất hoàn toàn — mà trang quản trị vẫn hay được mở trên điện thoại.
 * Popover mở bằng một cú chạm, chạy ở cả hai nơi.
 */
export function ChuThich({
  children,
  nhan = "Giải thích",
}: {
  children: ReactNode;
  /** Đọc cho trình đọc màn hình; không hiện ra mắt thường. */
  nhan?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={nhan}
        className="inline-flex shrink-0 items-center text-muted-foreground/50 transition hover:text-gold focus-visible:text-gold focus-visible:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 text-xs leading-relaxed text-muted-foreground"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
