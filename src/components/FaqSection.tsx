import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * Câu hỏi thường gặp.
 *
 * Thay cho khối "Liên hệ với chúng tôi" cũ, vốn in ra email, hotline và địa
 * chỉ văn phòng đều là dữ liệu bịa (hello@astrotarot.vn, 1900 8868, "Toà
 * Mystic Tower") cùng một form gửi tin nhắn không nối vào đâu cả. In thông tin
 * liên hệ giả lên trang chủ là cách nhanh nhất để mất lòng tin người dùng.
 *
 * Người phân vân trước khi thử tarot thường vướng đúng mấy câu dưới đây; trả
 * lời thẳng có ích hơn nhiều so với một ô "Nội dung..." không ai đọc.
 */

const FAQS = [
  {
    q: "Trải bài bằng AI có mất tiền không?",
    a: "Không. Bạn đặt câu hỏi, AI rút bài và diễn giải hoàn toàn miễn phí. Chỉ khi bạn muốn đặt lịch nói chuyện trực tiếp với Reader thật thì mới phát sinh chi phí, và giá hiện rõ trước khi đặt.",
  },
  {
    q: "AI đọc bài dựa trên cái gì?",
    a: "Trên ba thứ: lá bài rút được, câu hỏi bạn đặt, và bản đồ sao lập từ ngày giờ nơi sinh nếu bạn đã điền. Không có bản đồ sao thì vẫn đọc được, chỉ là kém cá nhân hoá hơn.",
  },
  {
    q: "Thông tin ngày giờ sinh của tôi có an toàn không?",
    a: "Dữ liệu ngày giờ và nơi sinh được mã hoá AES-256-GCM trước khi lưu, không nằm dạng đọc được trong cơ sở dữ liệu. Bạn xoá hồ sơ chiêm tinh lúc nào cũng được.",
  },
  {
    q: "Tôi chưa biết gì về Tarot thì bắt đầu từ đâu?",
    a: "Rút thử một lá ở ngay trang này. Mỗi lá đều kèm từ khoá và một câu gợi mở, không cần thuộc gì trước. Muốn đi sâu hơn thì mục Nhật ký có các bài hướng dẫn trải bài 3 lá và ý nghĩa từng lá.",
  },
  {
    q: "Đặt lịch với Reader thì thanh toán thế nào?",
    a: "Tiền được giữ ở tài khoản ký quỹ và chỉ chuyển cho Reader sau khi buổi xem kết thúc. Nếu Reader huỷ hoặc không xuất hiện, bạn được hoàn lại.",
  },
  {
    q: "Mua vật phẩm thì giao hàng ra sao?",
    a: "Giao toàn quốc, phí cố định 30.000₫ mỗi đơn. Sau khi đặt, đơn ở trạng thái chờ xác nhận và shop sẽ liên hệ lại; bạn theo dõi trạng thái ở mục Đơn hàng của tôi.",
  },
];

export function FaqSection() {
  // Mở sẵn câu đầu để người dùng thấy ngay đây là khối bấm được, chứ không
  // phải một danh sách tiêu đề chết.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Reveal>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
            ✦ Còn thắc mắc
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">
            Câu hỏi thường gặp
          </h2>
        </div>
      </Reveal>

      <div className="mt-8 space-y-3">
        {FAQS.map((faq, i) => {
          const expanded = open === i;
          return (
            <Reveal key={faq.q} delay={i * 0.04}>
              <div className="glass overflow-hidden rounded-xl">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : i)}
                    aria-expanded={expanded}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gold/5"
                  >
                    <span className="text-sm font-medium text-foreground sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </h3>
                {/* Dùng hidden thay vì bỏ khỏi DOM để nội dung vẫn nằm trong
                    HTML cho công cụ tìm kiếm và trình đọc màn hình. */}
                <div
                  id={`faq-panel-${i}`}
                  hidden={!expanded}
                  className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground"
                >
                  {faq.a}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa thấy câu trả lời bạn cần?{" "}
          <Link to="/readers" className="text-gold hover:underline">
            Hỏi thẳng một Reader
          </Link>{" "}
          — họ trả lời trong buổi xem đầu tiên.
        </p>
      </Reveal>
    </div>
  );
}
