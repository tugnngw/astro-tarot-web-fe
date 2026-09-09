// ============================================================
// READER — React Query hooks
//
// Danh sách và hồ sơ Reader là dữ liệu công khai: khách chưa đăng nhập cũng
// gọi được, nên các hook này không cần chờ trạng thái đăng nhập.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { getReader, getVerifiedReaders } from "@/api/reader";

export const readerKeys = {
  all: ["readers"] as const,
  list: () => [...readerKeys.all, "list"] as const,
  detail: (id: string) => [...readerKeys.all, "detail", id] as const,
};

/** Danh sách Reader đã được duyệt. Đổi chậm nên giữ cache 2 phút. */
export function useReaders() {
  return useQuery({
    queryKey: readerKeys.list(),
    queryFn: getVerifiedReaders,
    staleTime: 2 * 60 * 1000,
  });
}

export function useReader(id: string) {
  return useQuery({
    queryKey: readerKeys.detail(id),
    queryFn: () => getReader(id),
    enabled: Boolean(id),
    // Hồ sơ không tồn tại thì thử lại cũng không đổi kết quả.
    retry: false,
  });
}
