/**
 * Kiểu chữ của một bài viết — dùng chung cho bản xem trước và bản đã đăng.
 *
 * ## Vì sao phải là MỘT nguồn
 *
 * Người viết soạn bài trong `BlogPreviewModal`, rồi bài hiện ra ở
 * `routes/blog.$slug.tsx`. Hai màn ấy BẮT BUỘC phải giống nhau từng pixel,
 * vì cả mục đích của bản xem trước là trả lời "đăng lên thì trông thế nào".
 * Lệch một bậc cỡ chữ là bản xem trước nói sai.
 *
 * Trước tệp này, hai chuỗi class được sao chép nguyên văn giữa hai tệp. Giống
 * nhau đúng vào lúc ấy, nhưng không có gì giữ cho chúng giống nhau: lần sau
 * ai sửa cỡ chữ ở một màn thì màn kia lặng lẽ lệch đi, và chỉ người viết bài
 * phát hiện ra — sau khi đã đăng.
 */

/** Tiêu đề bài viết. */
export const TIEU_DE_BAI =
  "font-display text-2xl sm:text-3xl lg:text-bai-tieu-de leading-snug text-gradient-gold";

/** Thân bài. `max-w-2xl` giữ dòng dưới ~75 ký tự cho dễ đọc. */
export const THAN_BAI =
  "mx-auto max-w-2xl text-bai sm:text-lg leading-[1.75] text-foreground/90 whitespace-pre-wrap";
