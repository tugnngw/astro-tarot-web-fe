import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { NguProvider } from "@/lib/ngon-ngu";
import { RealtimeProvider } from "@/features/realtime/RealtimeProvider";
import { StarrySky } from "@/components/StarrySky";
import { AuthModal } from "@/components/AuthModal";
import { BecomeReaderModal } from "@/components/BecomeReaderModal";
import { BackendWarmBanner } from "@/components/BackendWarmBanner";
import { LoiChucDipLe } from "@/features/khuyenmai/LoiChucDipLe";
import { FeedbackPrompt } from "@/components/FeedbackPrompt";
import { ChatDock } from "@/features/booking/components/ChatDock";
import { GocNoi } from "@/components/GocNoi";
import { captureUtmFromUrl, nguonGopY } from "@/lib/utm";
import { trackXemTrang } from "@/lib/track";
import { SITE_URL } from "@/lib/site";
import { duongDanTuRouter, initGA, trackPageView } from "@/lib/analytics";

function UtmCapture() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  return null;
}

function GoogleAnalyticsTracker() {
  const router = useRouter();
  useEffect(() => {
    initGA();
    if (typeof window !== "undefined") {
      const dau = window.location.pathname + window.location.search;
      trackPageView(dau, document.title);
      // Ghi cả vào bảng của mình, không chỉ GA4. Thiếu bước này thì ai vào
      // xem vài trang rồi đi — phần lớn khách thật — không để lại dòng nào,
      // và bảng quản trị trông như chỉ có dăm bảy lượt.
      trackXemTrang(dau);
    }
    return router.subscribe("onResolved", ({ toLocation }) => {
      const duongDan = duongDanTuRouter(toLocation);
      trackPageView(duongDan, document.title);
      trackXemTrang(duongDan);
    });
  }, [router]);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "ASTROTAROT — Khám phá vận mệnh" },
        {
          name: "description",
          content:
            "Trải bài Tarot AI cá nhân hoá & đặt lịch với Reader chuyên nghiệp.",
        },
        { property: "og:title", content: "ASTROTAROT — Khám phá vận mệnh" },
        {
          property: "og:description",
          content:
            "Trải bài Tarot AI cá nhân hoá & đặt lịch với Reader chuyên nghiệp.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:image", content: `${SITE_URL}/favicon.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "ASTROTAROT — Khám phá vận mệnh" },
        {
          name: "twitter:description",
          content:
            "Trải bài Tarot AI cá nhân hoá & đặt lịch với Reader chuyên nghiệp.",
        },
        { name: "twitter:image", content: `${SITE_URL}/favicon.png` },
      ],
      links: [
        // Địa chỉ chính thức của trang, khai bằng chính tên miền đã đăng ký.
        //
        // Cùng một nội dung đang phục vụ ở HAI tên miền: astrotarot.date và
        // bản *.vercel.app mà Vercel luôn giữ. Không khai canonical thì máy
        // nào đọc trang cũng phải tự đoán đâu là bản chính, và chúng hay đoán
        // ra bản vercel.app vì nó cũ hơn và được trỏ tới nhiều hơn.
        { rel: "canonical", href: `${SITE_URL}/` },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
        },
        { rel: "stylesheet", href: appCss },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {/*
          Đo lượt truy cập.

          Trước 12/10/2026 website KHÔNG đếm lượt xem trang nào. Thứ duy nhất
          được ghi là `trackCta`, và nó chỉ gọi ở năm chỗ — toàn nút bấm. Một
          người vào xem trang chủ, đọc blog, xem Reader rồi thoát thì không để
          lại dấu vết nào. Hướng dẫn EXE201 ở Outcome 2 lại đòi đúng con số
          lượt truy cập ấy.

          Đặt ở RootShell chứ không ở RootComponent: nó phải chạy trên MỌI
          trang, kể cả trang lỗi và trang chưa đăng nhập.

          Thành phần này chỉ chèn một thẻ script; nó không hiện gì trên màn
          hình và không đọc dữ liệu cá nhân nào. Vercel Analytics không dùng
          cookie, nên không phải thêm banner xin phép.

          CẦN BẬT THÊM MỘT CÔNG TẮC trong Vercel: dự án > Analytics > Enable.
          Thiếu bước đó thì script tải về rồi trả 404 ở mọi lần tải trang —
          đúng lý do bản tích hợp cũ bị gỡ đi, xem src/lib/track.ts.
        */}
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}

function CustomerWidgets() {
  const { user } = useAuth();
  // Trang đang đứng quyết định nguồn góp ý, không bắt người dùng tự chọn.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (user?.role === "admin") return null;
  return (
    <>
      {/* Lời chúc dịp lễ — máy chủ giữ sổ "đã chúc", nên hiện đúng một lần
          cho mỗi tài khoản, không phụ thuộc trình duyệt hay thiết bị. */}
      <LoiChucDipLe />
      <div className="fixed bottom-5 left-5 z-40">
        <FeedbackPrompt defaultSource={nguonGopY(pathname)} />
      </div>
      <GocNoi>
        <ChatDock />
      </GocNoi>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <NguProvider>
        <AuthProvider>
          <RealtimeProvider>
            <CartProvider>
              <UtmCapture />
              <GoogleAnalyticsTracker />
              <BackendWarmBanner />
              <StarrySky />
              <Outlet />
              <AuthModal />
              <BecomeReaderModal />
              {/*
              Góp ý ở góc trái, chat ở góc phải. Đứng cùng một cột thì nút
              Góp ý đè lên nút mở cuộc chat.

              Cục trao đổi đặt ở đây (ngoài Outlet) để nó sống qua mọi lần đổi
              trang: nó nghe tin nhắn ở MỌI trang, và một cuộc đang mở không
              bị dựng lại mỗi lần người dùng bấm sang chỗ khác. Ẩn với Quản trị viên.
            */}
              <CustomerWidgets />
              {/*
              Góc dưới bên phải, không phải giữa trên cùng: vị trí cũ đè đúng
              thanh điều hướng, che mất menu ngay lúc người dùng vừa thao tác
              xong và hay cần bấm tiếp.

              2,5 giây thay cho 4 giây mặc định — đủ đọc một câu ngắn. Riêng
              toast lỗi thì nơi gọi tự đặt thời gian dài hơn nếu cần.
            */}
              <Toaster
                position="bottom-right"
                /* Nhường chỗ cho cục trao đổi ở cùng góc: thiếu dòng này thì
                 toast đè lên đúng cái nút, và bấm vào nút hoá ra bấm toast. */
                offset="84px"
                theme="dark"
                richColors
                duration={2500}
                toastOptions={{
                  classNames: {
                    toast: "!text-xs !py-2.5 !px-3",
                    title: "!text-xs !font-medium",
                    description: "!text-[11px]",
                  },
                }}
              />
            </CartProvider>
          </RealtimeProvider>
        </AuthProvider>
      </NguProvider>
    </QueryClientProvider>
  );
}
