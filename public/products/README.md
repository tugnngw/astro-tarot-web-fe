# Ảnh sản phẩm

Ảnh ở thư mục này được `products.image_url` trỏ tới theo dạng
`/products/<tên-file>`. Khi `image_url` khác NULL thì giao diện dùng ảnh đó,
còn NULL thì rơi về artwork SVG sinh sẵn (`CelestialArtwork`).

Cột `products.image_is_illustrative` đi kèm: TRUE nghĩa là ảnh chỉ **minh hoạ**
chứ không phải ảnh chụp đúng món đang bán, và giao diện phải hiện nhãn
"Ảnh minh hoạ" (xem `shop.tsx`, `shop.$slug.tsx`, `FeaturedProducts.tsx`).
Gắn ảnh không đúng món mà im lặng là mô tả sai hàng.

## Ảnh thật

| File | Sản phẩm | Nguồn / giấy phép |
| --- | --- | --- |
| `rider-waite-tarot.jpg` | Rider-Waite Tarot | Lá The Magician, bộ Rider-Waite-Smith 1909. Hết hạn bản quyền — public domain. Ảnh của **đúng** bộ bài đang bán. |

## Ảnh minh hoạ (`image_is_illustrative = TRUE`)

Không phải ảnh của đúng món: ảnh sản phẩm của các bộ bài thương mại (Thoth,
Wild Unknown, Blue Owl, Maybe Lenormand, Moonology) thuộc bản quyền nhà xuất
bản, không lấy trên mạng về dùng được; đá khoáng, nến, khăn, hộp gỗ thì kho
ảnh tự do chỉ có ảnh của món tương tự. Tất cả đều lấy từ Wikimedia Commons.

| File | Sản phẩm (slug) | File gốc trên Commons | Tác giả | Giấy phép |
| --- | --- | --- | --- | --- |
| `thoth-tarot.jpg` | `thoth-tarot` | Tarot cards - Celtic cross spread.jpg | Nosferattus | CC0 |
| `wild-unknown-tarot.jpg` | `wild-unknown-tarot` | Tarot cards - 3 card spread.jpg | Nosferattus | CC0 |
| `maybe-lenormand.jpg` | `maybe-lenormand` | Tarot cards - 3 card spread with candles.jpg | Nosferattus | CC0 |
| `blue-owl-lenormand.jpg` | `blue-owl-lenormand` | Lenormand.jpg | FIST (German Wikipedia) | Public domain |
| `moonology-oracle.png` | `moonology-oracle` | Moon Phase (PSF).png | Pearson Scott Foresman | Public domain |
| `thach-anh-tim-tru-500g.jpg` | `thach-anh-tim-tru-500g` | Amethyst Druse.jpg | Ra'ike | CC BY 2.5 |
| `vong-thach-anh-hong-8mm.jpg` | `vong-thach-anh-hong-8mm` | Rose quartz pebbles.jpg | Mauro Cateb | CC BY-SA 3.0 |
| `da-mat-trang-set-3.jpg` | `da-mat-trang-set-3` | Moonstone.cabochons.arp.jpg | Arpingstone | Public domain |
| `hop-go-dung-bai.jpg` | `hop-go-dung-bai` | Carved Wooden Bowl With Lid (30646940752).jpg | Archives New Zealand | CC BY 2.0 |
| `khan-trai-bai-nhung.jpg` | `khan-trai-bai-nhung` | Silk Fabric (7194805316) (2).jpg | David Schroeter | CC BY-SA 2.0 |
| `nen-tram-huong-200g.jpg` | `nen-tram-huong-200g` | Scented candle.jpg | MichalPL | CC BY-SA 4.0 |

Trang gốc của mỗi file: `https://commons.wikimedia.org/wiki/File:<tên file gốc>`
(thay dấu cách bằng `_`).

### Nghĩa vụ ghi công

CC BY và CC BY-SA **bắt buộc** ghi tên tác giả + giấy phép ở nơi người xem
thấy được. Bảng trên là bản ghi nội bộ; trước khi chạy thật cần thêm một trang
`/credits` (hoặc mục ghi công ở footer) liệt kê đúng những dòng này. CC0 và
public domain thì không bắt buộc, nhưng ghi vào cho đủ.

## Thay bằng ảnh thật

Khi có ảnh nhà cung cấp cấp cho hoặc tự chụp: ghi đè file cùng tên, rồi
`UPDATE products SET image_is_illustrative = FALSE WHERE slug = '<slug>';`
trong một migration mới. Nhãn "Ảnh minh hoạ" sẽ tự biến mất.

## Quy cách nên theo

- Tỉ lệ 4:3, nền tối hoặc trong suốt để hợp tông trang.
- Cạnh dài khoảng 800px, JPEG hoặc WEBP, dưới 150KB mỗi ảnh.
- Mấy ảnh minh hoạ hiện tại là bản 960px tải thẳng từ Commons nên còn nặng
  (`khan-trai-bai-nhung.jpg` ~394KB). Chưa nén lại vì ảnh nào cũng sắp bị thay
  bằng ảnh thật; nếu giữ lâu thì nên convert sang WEBP.
