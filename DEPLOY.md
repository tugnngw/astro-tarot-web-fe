# Đưa frontend lên Vercel

Trang này chạy **SSR** (TanStack Start), không phải trang tĩnh. Mỗi lần tải là
một hàm Node dựng HTML trên máy chủ của Vercel rồi mới gửi về trình duyệt.
Điều đó ảnh hưởng tới toàn bộ cách cấu hình bên dưới.

---

## Trước khi bắt đầu

Backend phải chạy được ở một địa chỉ **https** công cộng. Xem `DEPLOY.md` của
repo backend. Chưa có backend thì cứ deploy được, nhưng trang sẽ chạy bằng dữ
liệu giả (mock).

---

## Cách bản build được tạo ra

Đây là chỗ dễ mắc kẹt nhất, nên nói rõ.

`vite.config.ts` dùng `@lovable.dev/vite-tanstack-config`. Gói này chỉ bật
plugin nitro khi nhận ra đang chạy trong sandbox của Lovable. Build ở máy mình
hay trên Vercel đều không phải sandbox, nên mặc định nó in ra dòng

```
[@lovable.dev/vite-tanstack-config] No Lovable context detected — skipping nitro deploy plugin.
```

rồi chỉ sinh ra `dist/client` và `dist/server/server.js`. Vercel nhìn vào hai
thư mục đó không biết phải chạy cái gì — kết quả là deploy "thành công" nhưng mở
lên chỉ thấy 404 hoặc trang trắng.

`vite.config.ts` đã xử lý bằng cách khai nitro tường minh khi phát hiện biến
`VERCEL` (Vercel tự đặt `VERCEL=1` lúc build):

```ts
const isVercelBuild = !!process.env.VERCEL;
export default defineConfig({
  nitro: isVercelBuild ? { preset: "vercel" } : undefined,
  // ...
});
```

Lúc đó nitro sinh ra `.vercel/output/` theo chuẩn Build Output API v3 và Vercel
tự nhận. Ở máy mình `npm run build` giữ nguyên hành vi cũ, khỏi phải chờ nitro
đóng gói mỗi lần.

**Thử trước bản build của Vercel ngay tại máy:**

```bash
VERCEL=1 VITE_API_BASE_URL=https://api.ten-mien-that.com npm run build
```

Xong phải thấy `.vercel/output/config.json`,
`.vercel/output/functions/__server.func/` và `.vercel/output/static/`.

Lưu ý: `npx vite preview` **không** xem được bản build này — plugin xem trước
của TanStack đi tìm `dist/server/server.js` theo bố cục mặc định và sẽ báo
`ERR_MODULE_NOT_FOUND`. Đó là giới hạn của lệnh preview, không phải lỗi bản
build.

---

## Trang đang chạy ở đâu

**https://astro-tarot-web-fe.vercel.app**

Deploy bằng **Vercel CLI từ máy**, không nối với GitHub. Lý do: repo thuộc tài
khoản `tugnngw`, còn Vercel thì thuộc `Megalit2578`, và Vercel chỉ nhập được
repo mà nó đã được cài GitHub App lên đó — kể cả repo public, kể cả khi nhập
bằng URL trực tiếp.

### Deploy lại sau khi sửa code

```bash
npx vercel deploy --prod
```

Chạy trong thư mục này. **Push lên git KHÔNG tự deploy** — đây là điểm khác
biệt lớn nhất so với cách nối GitHub, rất dễ quên rồi ngồi thắc mắc sao sửa mãi
mà trang không đổi.

Thư mục `.vercel/` (đã gitignore) giữ liên kết tới dự án; xoá nó đi thì lần sau
CLI sẽ hỏi lại và có thể tạo nhầm một dự án mới.

### Muốn có tự động deploy mỗi lần push

Nhờ chủ repo `tugnngw` cài [Vercel GitHub App](https://github.com/apps/vercel)
cho repo `astro-tarot-web-fe`, rồi ở Project Settings → Git nối vào và chọn
nhánh `feat/dat-branch`. Hoặc chạy `npx vercel git connect` sau khi app đã được
cài.

---

## Các bước (nếu dựng lại từ đầu bằng giao diện web)

### 1. Nhập dự án vào Vercel

Ở [vercel.com/new](https://vercel.com/new), chọn repo này và nhánh
`feat/dat-branch`.

`vercel.json` đã khai sẵn nên **không cần đụng gì** trong phần Build Settings:

```json
{
  "framework": null,
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

Đặc biệt **để trống Output Directory**. Điền vào đó là Vercel bỏ qua
`.vercel/output` và đi tìm thư mục tĩnh — trang sẽ không có phần máy chủ.

### 2. Khai biến môi trường

Project Settings → Environment Variables, thêm cho cả ba môi trường
(Production, Preview, Development):

| Tên | Giá trị |
|---|---|
| `VITE_API_BASE_URL` | `https://api.ten-mien-that.com` |

Ba điều dễ sai:

- **Phải là `https`.** Trang Vercel chạy https; trình duyệt cấm trang https gọi
  API http (mixed content). Trang vẫn hiện ra nhưng mọi thứ động đều chết lặng
  lẽ trong console.
- **Không có dấu `/` ở cuối.**
- **Giá trị được nhúng lúc build, không đọc lúc chạy.** Đổi biến xong phải bấm
  Redeploy; refresh trang không ăn thua.

Quên đặt biến này thì bản build production để trống URL backend, toàn bộ trang
tự động chuyển sang dữ liệu giả, và console in ra:
`[cấu hình] Thiếu VITE_API_BASE_URL lúc build.`

### 3. Deploy, rồi nối ngược về backend

Bấm Deploy. Xong thì Vercel cho một domain dạng `ten-du-an.vercel.app`.

**Chưa xong ở đây.** Backend phải biết domain đó, nếu không trình duyệt chặn mọi
lời gọi API vì CORS. Domain hiện tại là `https://astro-tarot-web-fe.vercel.app`.

Trên Render, đặt hai biến môi trường (Environment → Environment Variables):

```
FRONTEND_URL=https://astro-tarot-web-fe.vercel.app
CORS_ALLOWED_ORIGINS=https://astro-tarot-web-fe.vercel.app
```

Render tự deploy lại khi đổi biến môi trường.

Nếu chạy trên VPS thì sửa `.env` của backend với đúng hai dòng trên rồi khởi
động lại:

```bash
docker compose -f docker-compose.prod.yml up -d backend
```

### 4. Chọn khu vực máy chủ

Mặc định hàm SSR chạy ở Mỹ. Mỗi lần tải trang, máy chủ Vercel ở Mỹ phải gọi
sang backend đặt tại Việt Nam rồi mới trả về — mỗi vòng thêm khoảng 400 ms.

Project Settings → Functions → Function Region, chọn **Singapore (sin1)**.

---

## Kiểm tra sau khi deploy

1. Mở trang chủ — phải thấy nền đen và các lá bài tarot xoay.
2. Mở DevTools → Network, lọc `Fetch/XHR`, tải lại trang.
   Các lời gọi phải đi tới `https://api.ten-mien-that.com/...` và trả 200.
3. Đăng ký một tài khoản → phải nhận được mail xác minh, và link trong mail
   phải trỏ về domain Vercel (không phải `localhost`).
4. Vào `/shop`, bấm nút mua — phải mở tab mới sang Shopee.

---

## Khi có sự cố

**Deploy xong mở lên thấy 404 ở mọi đường dẫn**

Bản build không ra `.vercel/output`. Xem log build trên Vercel, tìm dòng
`skipping nitro deploy plugin`. Nếu có, biến `VERCEL` không tới được
`vite.config.ts` — kiểm tra lại phần `isVercelBuild`. Cũng kiểm tra Output
Directory trong Build Settings phải để trống.

**Console báo `blocked by CORS policy`**

`CORS_ALLOWED_ORIGINS` bên backend chưa khớp domain Vercel. Chép **đúng** domain
trên thanh địa chỉ, kể cả `https://`, không có `/` ở cuối.

Mỗi lần đẩy nhánh, Vercel còn tạo thêm domain xem trước dạng
`ten-du-an-git-abc-tai-khoan.vercel.app`. Muốn các bản xem trước cũng gọi được
API thì thêm mẫu vào backend:

```
CORS_ALLOWED_ORIGINS=https://ten-du-an.vercel.app,https://*-tai-khoan.vercel.app
```

(Backend dùng `setAllowedOriginPatterns` nên chấp nhận dấu `*`.)

**Console báo `Mixed Content`**

`VITE_API_BASE_URL` vẫn là `http://`. Sửa thành `https://` rồi **Redeploy**.

**Trang hiện dữ liệu lạ, không phải dữ liệu thật**

Đó là dữ liệu giả — nghĩa là `VITE_API_BASE_URL` trống lúc build. Kiểm tra biến
đã đặt cho đúng môi trường (Production) chưa, rồi Redeploy.

**Build hỏng vì `npm ci`**

`package-lock.json` lệch với `package.json`. Chạy `npm install` ở máy, commit
`package-lock.json` rồi đẩy lại.
