// Hướng dẫn xoá tài khoản.
//
// CH Play bắt buộc có một đường dẫn CÔNG KHAI để yêu cầu xoá tài khoản, mở
// được mà KHÔNG cần cài ứng dụng và KHÔNG cần đăng nhập. Lý do của quy định:
// người đã gỡ app khỏi máy vẫn phải xoá được dữ liệu của mình.
//
// Đường dẫn này điền vào ô "URL xoá tài khoản" trong Play Console, mục Chính
// sách > An toàn dữ liệu. Vì vậy trang cố ý không bọc RoleGuard.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2, Smartphone, Globe, Mail } from "lucide-react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/xoa-tai-khoan")({
  head: () => ({
    meta: [
      { title: "Xoá tài khoản — ASTROTAROT" },
      {
        name: "description",
        content:
          "Ba cách xoá tài khoản ASTROTAROT, và chính xác những gì bị xoá, những gì được giữ lại.",
      },
    ],
  }),
  component: TrangXoaTaiKhoan,
});

// Địa chỉ liên hệ do chủ dự án chọn (05/10/2026). Đây là hộp thư CÁ NHÂN đặt
// công khai, nên nếu về sau nhóm lập hộp thư riêng thì đổi cả ở đây lẫn trong
// chinh-sach-rieng-tu.tsx.
const LIEN_HE = "megalit2578@gmail.com";

function Cach({
  icon: Icon,
  tieuDe,
  children,
}: {
  icon: React.ElementType;
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-mystic/40 bg-card/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-gold" />
        <h2 className="font-semibold text-foreground">{tieuDe}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function TrangXoaTaiKhoan() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>

        <div className="mb-8 flex items-start gap-3">
          <Trash2 className="mt-1 size-6 shrink-0 text-gold" />
          <div>
            <h1 className="text-2xl font-semibold">Xoá tài khoản ASTROTAROT</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ba cách, chọn cách nào cũng được.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Cach icon={Smartphone} tieuDe="Trong ứng dụng di động">
            <p>
              Mở thẻ <strong className="text-foreground">Tài khoản</strong>, kéo
              xuống cuối, chạm{" "}
              <strong className="text-foreground">Xoá tài khoản</strong>. Nhập
              mật khẩu để xác nhận.
            </p>
          </Cach>

          <Cach icon={Globe} tieuDe="Trên trang web">
            <p>
              Vào{" "}
              <Link to="/profile" className="text-gold underline">
                Hồ sơ
              </Link>{" "}
              và làm tương tự.
            </p>
          </Cach>

          <Cach icon={Mail} tieuDe="Không mở được ứng dụng">
            <p>
              Gửi thư tới{" "}
              <a
                href={`mailto:${LIEN_HE}?subject=${encodeURIComponent("Yêu cầu xoá tài khoản ASTROTAROT")}`}
                className="text-gold underline underline-offset-2"
              >
                {LIEN_HE}
              </a>{" "}
              <strong className="text-foreground">
                từ chính địa chỉ email bạn đã đăng ký
              </strong>
              . Gửi từ địa chỉ khác thì chúng tôi không có cách nào biết bạn là
              chủ tài khoản, nên sẽ không xử lý được.
            </p>
            <p>Chúng tôi xoá trong vòng 30 ngày và báo lại khi xong.</p>
          </Cach>
        </div>

        <div className="mt-9 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Chính xác thì cái gì mất, cái gì còn
          </h2>

          <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-5">
            <h3 className="mb-2 text-sm font-semibold text-rose-300">
              Xoá hẳn, không lấy lại được
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                Hồ sơ chiêm tinh — ngày sinh, giờ sinh, nơi sinh kèm toạ độ
              </li>
              <li>Ảnh đại diện</li>
            </ul>
          </div>

          <div className="rounded-xl border border-mystic/40 bg-card/40 p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Gỡ tên bạn khỏi hệ thống ngay
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Email, họ tên, số điện thoại, địa chỉ</li>
              <li>Mọi phiên đăng nhập bị thu hồi</li>
              <li>
                Địa chỉ email được trả lại — về sau bạn vẫn đăng ký mới được
                bằng chính địa chỉ đó
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-mystic/40 bg-card/40 p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Giữ lại, ở dạng đã gỡ tên
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Hoá đơn và lịch sử giao dịch — chứng từ kế toán phải giữ</li>
              <li>
                Các buổi xem đã diễn ra và đánh giá bạn đã viết — đây là lịch sử
                làm việc của Reader. Xoá chúng là lặng lẽ đổi điểm trung bình
                của một người không liên quan gì tới quyết định của bạn.
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Chi tiết về dữ liệu chúng tôi giữ:{" "}
          <Link to="/chinh-sach-rieng-tu" className="text-gold underline">
            Chính sách riêng tư
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
