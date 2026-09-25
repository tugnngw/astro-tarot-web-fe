/*
 * Cấu hình RIÊNG cho test, không dùng lại vite.config.ts.
 *
 * vite.config.ts đi qua wrapper của Lovable, và wrapper đó kéo theo cả
 * tanstackStart, nitro, componentTagger, dò sandbox… Những thứ ấy cần thiết để
 * chạy và để build, nhưng với một phép kiểm hàm thuần thì chúng chỉ làm bộ test
 * chậm và giòn — một plugin đổi hành vi là test đỏ vì lý do chẳng liên quan gì
 * tới mã đang kiểm.
 *
 * Nên ở đây khai tối thiểu: chỉ giữ alias "@" cho khớp với tsconfig, và môi
 * trường jsdom cho những chỗ chạm tới localStorage.
 */
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // Đo trên mã nguồn thật, không đo mã sinh ra hay mã cấu hình.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/routeTree.gen.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
      ],
    },
  },
});
