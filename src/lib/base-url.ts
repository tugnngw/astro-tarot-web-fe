// URL gốc của BE.
// Lấy từ biến môi trường VITE_API_BASE_URL (khai báo trong .env khi chạy máy,
// khai trong Project Settings → Environment Variables khi chạy trên Vercel).
// Không hardcode URL ở đây — mỗi môi trường tự đặt.
//
// Giá trị được NHÚNG LÚC BUILD. Đổi biến trên Vercel xong phải Redeploy.
const configured = import.meta.env.VITE_API_BASE_URL;

/*
 * Chỉ lùi về localhost khi đang chạy máy dev.
 *
 * Trước đây fallback này áp dụng cho mọi bản build, nên quên đặt biến trên
 * Vercel là trang lên bình thường rồi mọi lời gọi API chạy tới localhost:8080
 * của MÁY NGƯỜI XEM — lỗi hiện ra là "không kết nối được", không hề nhắc gì tới
 * việc thiếu cấu hình, và mất rất lâu mới lần ra. Để rỗng thì client.ts ném
 * MockUnavailableError với đúng tên biến còn thiếu.
 */
export const VITE_API_BASE_URL =
  configured ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

if (!configured && !import.meta.env.DEV) {
  console.error(
    "[cấu hình] Thiếu VITE_API_BASE_URL lúc build. Đặt biến này trên Vercel rồi Redeploy.",
  );
}
