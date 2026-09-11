import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ApiError } from "./api/client";

/**
 * Chính sách thử lại dùng chung cho mọi truy vấn.
 *
 * Mặc định của React Query là thử lại 3 lần với nhịp 1s-2s-4s, tức là bỏ cuộc
 * sau khoảng bảy giây. Backend nằm trên gói free của Render, ngủ sau 15 phút
 * không ai gọi và cần 50 giây trở lên để dậy — nên bảy giây đó luôn hết trước
 * khi máy chủ kịp trả lời, và danh sách hiện ra một lỗi khó hiểu dù chỉ cần
 * chờ thêm một chút là có dữ liệu.
 *
 * Mặt khác, thử lại một lỗi 4xx là vô ích: 403 lần thứ tư vẫn là 403, mà người
 * dùng phải ngồi nhìn ô trống lâu gấp bốn.
 */
function nenThuLai(soLanDaHong: number, error: unknown) {
  if (error instanceof ApiError) {
    // 0 = chưa tới được máy chủ; 408/429/5xx = phía máy chủ, có thể qua đi.
    const tamThoi =
      error.status === 0 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500;
    if (!tamThoi) return false;
  }
  return soLanDaHong < 2;
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: nenThuLai,
        // apiFetch đã tự giãn nhịp bên trong một lần gọi, nên ở tầng này chỉ
        // cần một khoảng chờ vừa phải giữa các lần.
        retryDelay: (soLan) => Math.min(1_000 * 2 ** soLan, 8_000),
        // Dữ liệu còn tươi trong 30 giây: đổi tab qua lại không bắn lại một
        // loạt lời gọi, vốn là thứ làm mọi thứ chậm thấy rõ khi mạng yếu.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Không tự thử lại lệnh ghi: gọi lại một POST có thể đặt hai lịch hẹn.
        retry: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
