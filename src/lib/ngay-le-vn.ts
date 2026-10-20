/**
 * Mẫu điền nhanh cho các dịp lễ Việt Nam.
 *
 * Chỉ là gợi ý cho ô nhập — quản trị vẫn sửa được mọi thứ trước khi lưu.
 * Không có đợt nào tự chạy từ danh sách này; không gì ở đây trừ tiền của ai.
 */

export interface MauDipLe {
  ten: string;
  /** Tháng–ngày dương lịch, cố định hằng năm. */
  thang?: number;
  ngay?: number;
  /** Số ngày đợt kéo dài, tính từ ngày bắt đầu. */
  soNgay: number;
  loiChuc: string;
  /**
   * Ngày theo ÂM lịch nên đổi mỗi năm — không tính được bằng `Date`.
   *
   * Những dịp này vẫn có mặt trong danh sách vì chúng là dịp bán tốt nhất
   * trong năm, nhưng mẫu chỉ điền sẵn tên và lời chúc; ngày phải tra lịch
   * rồi chọn tay. Đoán bừa một ngày âm lịch là đợt chạy lệch cả tuần.
   */
  theoAmLich?: boolean;
}

export const MAU_DIP_LE: MauDipLe[] = [
  {
    ten: "Tết Dương lịch",
    thang: 1,
    ngay: 1,
    soNgay: 3,
    loiChuc:
      "Chúc bạn một năm mới nhiều sức khoẻ, bình an và gặp được những điều tốt lành.",
  },
  {
    ten: "Tết Nguyên đán",
    soNgay: 7,
    theoAmLich: true,
    loiChuc:
      "Chúc bạn và gia đình một cái Tết ấm áp, một năm mới hanh thông và nhiều may mắn.",
  },
  {
    ten: "Giỗ tổ Hùng Vương",
    soNgay: 1,
    theoAmLich: true,
    loiChuc: "Chúc bạn một ngày Giỗ tổ an lành bên gia đình.",
  },
  {
    ten: "Ngày Quốc tế Phụ nữ",
    thang: 3,
    ngay: 8,
    soNgay: 2,
    loiChuc: "Chúc bạn luôn được yêu thương, và luôn tự tin vào chính mình.",
  },
  {
    ten: "Giải phóng miền Nam & Quốc tế Lao động",
    thang: 4,
    ngay: 30,
    soNgay: 3,
    loiChuc: "Chúc bạn kỳ nghỉ lễ thật vui và thật nhiều năng lượng.",
  },
  {
    ten: "Quốc khánh",
    thang: 9,
    ngay: 2,
    soNgay: 3,
    loiChuc: "Chúc bạn một ngày Quốc khánh vui vẻ bên những người thân yêu.",
  },
  {
    ten: "Tết Trung thu",
    soNgay: 3,
    theoAmLich: true,
    loiChuc: "Chúc bạn một mùa Trung thu thật tròn đầy và ấm áp.",
  },
  {
    ten: "Ngày Phụ nữ Việt Nam",
    thang: 10,
    ngay: 20,
    soNgay: 2,
    loiChuc: "Chúc bạn một ngày thật nhẹ nhõm và được quan tâm thật nhiều.",
  },
  {
    ten: "Ngày Nhà giáo Việt Nam",
    thang: 11,
    ngay: 20,
    soNgay: 2,
    loiChuc: "Chúc bạn một ngày 20/11 thật ý nghĩa.",
  },
  {
    ten: "Giáng sinh",
    thang: 12,
    ngay: 24,
    soNgay: 3,
    loiChuc: "Chúc bạn một mùa Giáng sinh ấm áp và an lành.",
  },
];

/**
 * Khoảng ngày gợi ý cho một mẫu, tính theo múi giờ của máy đang dùng.
 *
 * Trả `null` cho dịp theo âm lịch: ngày ấy đổi mỗi năm và không suy ra được
 * từ lịch dương. Đoán bừa thì đợt chạy lệch cả tuần, nên thà để quản trị tự
 * chọn còn hơn điền sẵn một ngày sai.
 *
 * Mốc kết thúc là 00:00 của ngày KẾ TIẾP ngày cuối, vì máy chủ không tính mốc
 * kết thúc vào khoảng chạy. Đợt "01/01, 3 ngày" chạy hết ngày 03/01.
 */
export function khoangNgayGoiY(
  mau: MauDipLe,
  nam: number,
): { batDau: Date; ketThuc: Date } | null {
  if (mau.theoAmLich || mau.thang == null || mau.ngay == null) return null;

  const batDau = new Date(nam, mau.thang - 1, mau.ngay, 0, 0, 0, 0);
  const ketThuc = new Date(nam, mau.thang - 1, mau.ngay + mau.soNgay, 0, 0, 0, 0);
  return { batDau, ketThuc };
}

/** `YYYY-MM-DDTHH:mm` cho `<input type="datetime-local">`, theo giờ máy. */
export function choONhapNgay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}`
  );
}
