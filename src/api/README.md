# `src/api/` — Lớp kết nối Backend

Tất cả lời gọi HTTP đến backend đều đi qua thư mục này.
Mục đích: UI **không** biết là đang gọi mock hay API thật.

## Cấu trúc

```
src/api/
├── client.ts        # fetch wrapper: base URL, JWT, refresh token, error
├── types.ts         # Kiểu dữ liệu khớp 1-1 với schema PostgreSQL (V1__init_schema.sql)
├── auth.ts          # POST /auth/login, /register, /refresh, /logout, /forgot, /reset
├── users.ts         # GET/PATCH /users/me, /users/me/astrological-data
├── readers.ts       # GET /readers, /readers/:id, /readers/:id/availability
├── bookings.ts      # POST /bookings, PATCH /bookings/:id/status, GET /bookings/me
├── tarot.ts         # POST /tarot/readings, /tarot/readings/:id/cards
├── chat.ts          # GET/POST /chat/sessions, /chat/sessions/:id/messages
└── payments.ts      # POST /payments/intents (VNPay / Momo)
```

## Bật chế độ kết nối thật

1. Tạo file `.env` ở root project:
   ```
   VITE_API_BASE_URL=https://api.astrotarot.vn
   ```
2. Restart dev server.
3. Khi `VITE_API_BASE_URL` rỗng, toàn bộ API tự động trả về dữ liệu MOCK
   (lưu trong `localStorage`) — tiện cho phát triển UI khi BE chưa sẵn sàng.

## Hợp đồng API (Contract)

Tất cả endpoint trả JSON dạng:

```json
{ "data": <payload>, "error": null }
```

hoặc lỗi:

```json
{ "data": null, "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }
```

Auth dùng **JWT access token + refresh token** (đúng theo bảng `user_sessions`).

- Access token gửi qua header `Authorization: Bearer <token>`.
- Refresh token lưu trong `localStorage` (hoặc httpOnly cookie nếu BE hỗ trợ).
- `client.ts` tự động refresh khi gặp HTTP 401.
