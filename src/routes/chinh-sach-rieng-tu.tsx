// Chính sách riêng tư.
//
// CH Play và App Store đều BẮT BUỘC có một đường dẫn chính sách riêng tư, và
// nó phải mở được mà KHÔNG cần đăng nhập — người duyệt mở bằng trình duyệt
// sạch, không có phiên nào. Vì vậy trang này cố ý không bọc RoleGuard.
//
// Nội dung viết theo dữ liệu app THẬT SỰ thu thập, đọc từ chính mã nguồn chứ
// không chép mẫu. Khai sai nguy hiểm hơn khai thiếu: cả hai chợ đều đối chiếu
// với hành vi thật của ứng dụng, lệch là gỡ ứng dụng.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/chinh-sach-rieng-tu")({
  head: () => ({
    meta: [
      { title: "Chính sách riêng tư — ASTROTAROT" },
      {
        name: "description",
        content:
          "ASTROTAROT thu thập những gì, dùng vào việc gì, giữ bao lâu, và bạn xoá tài khoản bằng cách nào.",
      },
    ],
  }),
  component: TrangChinhSach,
});

/** Ngày sửa gần nhất. Hai chợ đều hỏi chính sách có được cập nhật không. */
const NGAY_CAP_NHAT = "05/10/2026";

const LIEN_HE = "megalit2578@gmail.com";

function Muc({
  so,
  tieuDe,
  children,
}: {
  so: string;
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        <span className="mr-2 text-gold/70">{so}</span>
        {tieuDe}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function TrangChinhSach() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>

        <div className="mb-8 flex items-start gap-3">
          <ShieldCheck className="mt-1 size-6 shrink-0 text-gold" />
          <div>
            <h1 className="text-2xl font-semibold">Chính sách riêng tư</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cập nhật ngày {NGAY_CAP_NHAT}
            </p>
          </div>
        </div>

        <div className="space-y-9">
          <Muc so="1." tieuDe="Chúng tôi giữ những gì">
            <p>
              ASTROTAROT là nền tảng xem Tarot và chiêm tinh, gồm trang web và
              ứng dụng di động. Dưới đây là toàn bộ dữ liệu cá nhân hệ thống
              lưu, không có mục nào bị bỏ sót:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Tài khoản</strong> — địa chỉ
                email, tên hiển thị, ảnh đại diện nếu bạn tải lên, và số điện
                thoại nếu bạn tự điền.
              </li>
              <li>
                <strong className="text-foreground">
                  Ngày sinh, giờ sinh và nơi sinh
                </strong>{" "}
                — chỉ khi bạn tự tạo hồ sơ chiêm tinh. Đây là dữ liệu nhạy cảm
                nhất chúng tôi giữ, vì nó kèm cả toạ độ nơi sinh. Nó chỉ dùng để
                tính bản đồ sao cho chính bạn, không dùng vào việc gì khác và
                không chia sẻ với ai.
              </li>
              <li>
                <strong className="text-foreground">
                  Câu hỏi bạn gửi cho Tarot AI
                </strong>{" "}
                cùng lời giải nhận về, để bạn đọc lại trong lịch sử trải bài.
              </li>
              <li>
                <strong className="text-foreground">
                  Tin nhắn với Reader
                </strong>{" "}
                trong buổi xem đã đặt.
              </li>
              <li>
                <strong className="text-foreground">
                  Lịch sử giao dịch và số dư ví
                </strong>{" "}
                — số tiền, thời điểm, nội dung chuyển khoản.
              </li>
              <li>
                <strong className="text-foreground">Camera và micro</strong> —
                chỉ bật trong lúc bạn gọi video với Reader. Cuộc gọi đi thẳng
                giữa hai máy và{" "}
                <strong className="text-foreground">
                  chúng tôi không ghi lại
                </strong>{" "}
                hình hay tiếng.
              </li>
              <li>
                <strong className="text-foreground">
                  Nguồn bạn vào từ đâu
                </strong>{" "}
                — tham số chiến dịch trên đường dẫn, để biết kênh nào hiệu quả.
              </li>
            </ul>
          </Muc>

          <Muc so="2." tieuDe="Chúng tôi KHÔNG làm gì">
            <ul className="list-disc space-y-2 pl-5">
              <li>Không bán dữ liệu của bạn cho bất kỳ ai.</li>
              <li>Không ghi hình, ghi tiếng các cuộc gọi.</li>
              <li>
                Không dùng dữ liệu ngày sinh của bạn để quảng cáo hay phân nhóm
                tiếp thị.
              </li>
              <li>
                Không lưu số thẻ ngân hàng. Việc thanh toán do cổng PayOS xử lý;
                chúng tôi chỉ nhận lại kết quả giao dịch.
              </li>
            </ul>
          </Muc>

          <Muc so="3." tieuDe="Ai nhìn thấy dữ liệu của bạn">
            <p>
              Reader bạn đặt lịch nhìn thấy tên, nội dung trò chuyện và câu hỏi
              bạn gửi cho buổi đó — chỉ buổi đó thôi. Quản trị viên xem được
              thông tin tài khoản và lịch sử giao dịch khi xử lý khiếu nại.
            </p>
            <p>Dữ liệu được gửi tới các dịch vụ bên ngoài sau:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Google Gemini</strong> —
                nhận câu hỏi trải bài của bạn để sinh lời giải.
              </li>
              <li>
                <strong className="text-foreground">PayOS</strong> — xử lý thanh
                toán.
              </li>
              <li>
                <strong className="text-foreground">Cloudflare</strong> — máy
                chủ trung chuyển để cuộc gọi kết nối được qua mạng di động.
              </li>
            </ul>
          </Muc>

          <Muc so="4." tieuDe="Giữ bao lâu, và xoá thế nào">
            <p>
              Bạn xoá tài khoản bất cứ lúc nào: trong ứng dụng vào{" "}
              <strong className="text-foreground">
                Tài khoản → Xoá tài khoản
              </strong>
              , trên web vào{" "}
              <Link to="/profile" className="text-gold underline">
                Hồ sơ
              </Link>
              . Không cài ứng dụng cũng xoá được — xem{" "}
              <Link to="/xoa-tai-khoan" className="text-gold underline">
                hướng dẫn xoá tài khoản
              </Link>
              .
            </p>
            <p>Khi bạn xoá tài khoản:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Xoá hẳn</strong> — hồ sơ
                chiêm tinh của bạn (ngày, giờ, nơi sinh, toạ độ) và ảnh đại
                diện. Những thứ này chỉ thuộc về bạn và không bản ghi nào khác
                cần tới.
              </li>
              <li>
                <strong className="text-foreground">Gỡ tên khỏi</strong> — email,
                họ tên, số điện thoại, địa chỉ bị gỡ khỏi hệ thống ngay. Địa chỉ
                email được trả lại, nên về sau bạn vẫn đăng ký mới được bằng
                chính địa chỉ đó.
              </li>
              <li>
                <strong className="text-foreground">Giữ lại</strong> — hoá đơn và
                các buổi xem đã diễn ra, ở dạng đã gỡ tên. Chúng tôi phải giữ vì
                đó vừa là chứng từ kế toán, vừa là lịch sử làm việc của Reader —
                xoá chúng là lặng lẽ đổi kết quả của một người không liên quan
                gì tới quyết định của bạn.
              </li>
            </ul>
            <p>
              Mọi phiên đăng nhập bị thu hồi ngay. Việc xoá{" "}
              <strong className="text-foreground">không hoàn tác được</strong>.
            </p>
          </Muc>

          <Muc so="5." tieuDe="Trẻ em">
            <p>
              Dịch vụ dành cho người từ 16 tuổi trở lên. Nếu phát hiện tài khoản
              của người dưới tuổi này, chúng tôi sẽ xoá.
            </p>
          </Muc>

          <Muc so="6." tieuDe="Về nội dung do AI sinh ra">
            <p>
              Lời giải Tarot do mô hình ngôn ngữ sinh ra và{" "}
              <strong className="text-foreground">
                chỉ mang tính tham khảo, giải trí
              </strong>
              . Nó không phải tư vấn y tế, tài chính, pháp lý hay tâm lý. Gặp
              nội dung không phù hợp, bạn báo cho chúng tôi theo địa chỉ bên
              dưới.
            </p>
          </Muc>

          <Muc so="7." tieuDe="Liên hệ">
            <p>
              Có câu hỏi về dữ liệu của bạn, hoặc muốn yêu cầu xoá mà không mở
              được ứng dụng, hãy gửi thư tới{" "}
              <a
                href={`mailto:${LIEN_HE}`}
                className="text-gold underline underline-offset-2"
              >
                {LIEN_HE}
              </a>
              . Chúng tôi trả lời trong vòng 30 ngày.
            </p>
          </Muc>
        </div>
      </main>
    </div>
  );
}
