# Ảnh 22 lá Ẩn Chính (Major Arcana)

**Bộ bài:** Rider–Waite–Smith, xuất bản 1909 (minh hoạ: Pamela Colman Smith,
biên soạn: A. E. Waite).

**Giấy phép:** Bản in 1909 đã hết hạn bản quyền và thuộc phạm vi công cộng
(public domain) tại Hoa Kỳ. Đây là bộ bài Tarot được tái sử dụng rộng rãi nhất
vì lý do đó.

**Nguồn:** Wikimedia Commons, lấy qua API `commons.wikimedia.org/w/api.php`
(`prop=imageinfo&iiurlwidth=220`), tải bản thu nhỏ 220px từ `thumb.wikimedia.org`.
Tệp gốc trên Commons đặt tên theo dạng `File:RWS_Tarot_<số>_<Tên>.jpg`.

**Ngày tải:** 2026-09-08.

**Kích thước:** 22 tệp, trung bình ~56KB, tổng ~1.3MB.

## Lưu ý khi thay hoặc bổ sung

- Tên tệp ở đây (`00-fool.jpg` … `21-world.jpg`) được `src/components/TarotWheel.tsx`
  tham chiếu trực tiếp qua mảng `CARDS`. Đổi tên tệp thì phải sửa mảng đó.
- API của Wikimedia có giới hạn tần suất khá chặt: tải liên tiếp hơn ~10
  request sẽ nhận HTTP 429. Nếu cần tải lại, gom nhiều tiêu đề vào **một**
  lần gọi API (`titles=File:A|File:B|...`) rồi tải ảnh có giãn cách vài giây.
- Đường dẫn thumbnail phải qua host `thumb.wikimedia.org`. Ghép tay đường dẫn
  `/thumb/` trên `upload.wikimedia.org` sẽ trả HTTP 400.
- Nếu sau này bán hoặc phân phối lại bộ bài trong sản phẩm thương mại, nên rà
  lại tình trạng bản quyền ở thị trường mục tiêu — một số nước ngoài Hoa Kỳ
  tính thời hạn theo năm mất của tác giả (Pamela Colman Smith mất 1951).
