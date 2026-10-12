/**
 * Địa chỉ chính thức của trang — một chỗ duy nhất.
 *
 * Cùng một nội dung đang phục vụ ở HAI tên miền: `astrotarot.date` và bản
 * `*.vercel.app` mà Vercel luôn giữ kèm mỗi dự án. Chỉ một trong hai là tên
 * miền thật, và mọi thứ máy đọc được — canonical, og:url, sitemap, robots —
 * phải cùng chỉ vào nó.
 *
 * Trước 13/10/2026 chúng chỉ vào bản vercel.app, trong khi tên miền đăng ký
 * với các bên đối tác lại là astrotarot.date. Bên nào mở trang ra để đối
 * chiếu quyền sở hữu cũng sẽ đọc được một địa chỉ khác với địa chỉ bạn khai —
 * đúng thứ một bước xác minh chủ sở hữu website sẽ vấp phải.
 *
 * Không đọc từ biến môi trường: giá trị này phải giống nhau ở mọi bản dựng,
 * kể cả bản xem trước. Một bản xem trước tự khai mình là trang chính thì còn
 * tệ hơn là không khai gì.
 */
export const SITE_URL = "https://astrotarot.date";

/** Tên miền trần, dùng khi cần hiện cho người đọc. */
export const SITE_DOMAIN = "astrotarot.date";
