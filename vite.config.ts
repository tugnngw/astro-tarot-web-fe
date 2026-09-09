// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/*
 * Trang này chạy SSR, không phải trang tĩnh. Muốn Vercel phục vụ được thì bản
 * build phải theo chuẩn Build Output API (.vercel/output), và người dựng ra nó
 * là nitro.
 *
 * Vấn đề: wrapper của Lovable chỉ bật nitro khi nhận ra đang chạy trong sandbox
 * của họ. Build ở máy mình hay trên Vercel đều không phải sandbox, nên nó in ra
 * "skipping nitro deploy plugin" rồi bỏ qua — kết quả chỉ có dist/client và
 * dist/server/server.js, Vercel nhìn vào không biết chạy cái gì. Vì vậy phải
 * khai nitro một cách tường minh ở đây.
 *
 * Chỉ bật khi đang build trên Vercel (Vercel tự đặt biến VERCEL=1). Ở máy mình
 * `npm run build` giữ nguyên hành vi cũ, khỏi phải chờ nitro đóng gói mỗi lần.
 * Muốn thử trước bản build của Vercel ngay tại máy: VERCEL=1 npm run build
 */
const isVercelBuild = !!process.env.VERCEL;

export default defineConfig({
  nitro: isVercelBuild ? { preset: "vercel" } : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "0.0.0.0", // Cho phép truy cập từ LAN
      port: 8081, // Giữ nguyên port 8081
      strictPort: true, // Không đổi port nếu 8081 bị chiếm
    },
  },
});
