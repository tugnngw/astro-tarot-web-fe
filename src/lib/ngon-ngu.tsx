// Chuyển đổi tiếng Việt ↔ tiếng Anh.
//
// KHOÁ TRA LÀ CHÍNH CÂU TIẾNG VIỆT, không phải mã kiểu `booking.title`.
//
// Lý do: sản phẩm này có hơn hai nghìn chuỗi tiếng Việt viết thẳng trong mã,
// và dịch hết là việc nhiều ngày. Nếu dùng mã khoá thì mỗi chuỗi chưa khai
// báo sẽ hiện ra đúng cái mã ấy — giao diện vỡ ngay từ lần đầu bật tính năng,
// và phải dịch xong sạch mới dám bật. Tra theo câu tiếng Việt thì chuỗi nào
// chưa dịch tự rơi về tiếng Việt: trang vẫn đọc được, chỉ là lẫn hai thứ
// tiếng, nên dịch dần được mà không bao giờ gãy.
//
// Đánh đổi: sửa một chữ trong câu tiếng Việt là mất bản dịch của câu đó.
// Chấp nhận được — `thieu-ban-dich.mjs` quét ra danh sách còn thiếu, chạy
// trước mỗi lần phát hành là thấy ngay.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { EN } from "./tu-dien/en";

export type NgonNgu = "vi" | "en";

const KHOA_LUU = "astrotarot.ngon-ngu";

/** Đọc lựa chọn đã lưu. Chạy trên máy chủ thì luôn ra 'vi'. */
function docLuaChon(): NgonNgu {
  if (typeof window === "undefined") return "vi";
  try {
    return window.localStorage.getItem(KHOA_LUU) === "en" ? "en" : "vi";
  } catch {
    // Chế độ riêng tư chặn localStorage. Không đáng để sập trang.
    return "vi";
  }
}

type Ngu = {
  ngonNgu: NgonNgu;
  doiNgonNgu: (n: NgonNgu) => void;
  /** Dịch một câu. Chưa có bản dịch thì trả lại nguyên câu tiếng Việt. */
  t: (cau: string) => string;
};

const Boi = createContext<Ngu | null>(null);

export function NguProvider({ children }: { children: ReactNode }) {
  // Khởi tạo 'vi' rồi mới đọc localStorage trong useEffect, không đọc ngay ở
  // useState: trang này dựng sẵn ở máy chủ, đọc lệch nhau là React cảnh báo
  // hydration mismatch và thay cả cây DOM.
  const [ngonNgu, datNgonNgu] = useState<NgonNgu>("vi");

  useEffect(() => {
    const daLuu = docLuaChon();
    if (daLuu !== "vi") datNgonNgu(daLuu);
  }, []);

  const doiNgonNgu = useCallback((n: NgonNgu) => {
    datNgonNgu(n);
    try {
      window.localStorage.setItem(KHOA_LUU, n);
    } catch {
      // Không lưu được thì vẫn đổi cho phiên này.
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = n;
    }
  }, []);

  const t = useCallback(
    (cau: string) => (ngonNgu === "en" ? (EN[cau] ?? cau) : cau),
    [ngonNgu],
  );

  const gia = useMemo(
    () => ({ ngonNgu, doiNgonNgu, t }),
    [ngonNgu, doiNgonNgu, t],
  );

  return <Boi.Provider value={gia}>{children}</Boi.Provider>;
}

/**
 * Lấy hàm dịch.
 *
 * Gọi ngoài provider vẫn chạy và trả về tiếng Việt, thay vì ném lỗi. Có hơn
 * một trăm bảy mươi tệp sẽ dần dùng tới nó; một tệp nào đó được dựng trong
 * test hay trong Storybook mà thiếu provider thì không đáng làm sập cả màn.
 */
export function useNgu(): Ngu {
  const c = useContext(Boi);
  if (c) return c;
  return {
    ngonNgu: "vi",
    doiNgonNgu: () => {},
    t: (cau: string) => cau,
  };
}

/** Viết gọn cho trường hợp chỉ cần dịch. */
export function useT(): (cau: string) => string {
  return useNgu().t;
}
