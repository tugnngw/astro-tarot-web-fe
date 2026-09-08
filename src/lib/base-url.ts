// URL gốc của BE.
// Lấy từ biến môi trường VITE_API_BASE_URL (khai báo trong .env),
// fallback về backend chạy local nếu không set.
// Không hardcode URL ở đây nữa — mỗi máy/môi trường tự đặt trong .env.
export const VITE_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
