// Danh sách ngân hàng hỗ trợ nhận chuyển khoản qua VietQR.
//
// Nhúng sẵn thay vì gọi https://api.vietqr.io/v2/banks lúc chạy. Hai lý do:
// một dịch vụ ngoài nằm chắn giữa Reader và cái ô chọn ngân hàng là thêm một
// thứ có thể hỏng đúng vào lúc họ cần rút tiền; và danh sách này gần như không
// đổi — có ngân hàng mới thì cập nhật lại file, một việc của vài năm một lần.
//
// Mã BIN là thứ quyết định: "Vietcombank", "VCB" và "ngân hàng ngoại thương"
// là ba cách viết của cùng một nơi mà máy không đoán được, còn 970436 thì có.
//
// Nguồn: https://api.vietqr.io/v2/banks (lọc transferSupported = 1),
// lấy ngày 11/09/2026.

export interface NganHang {
  /** Mã BIN 6 chữ số theo chuẩn VietQR/Napas. */
  bin: string;
  /** Tên ngắn, dùng để hiển thị và tìm kiếm. */
  ten: string;
  tenDayDu: string;
}

export const DANH_SACH_NGAN_HANG: readonly NganHang[] = [
  { bin: "970425", ten: "ABBANK", tenDayDu: "Ngân hàng TMCP An Bình" },
  { bin: "970416", ten: "ACB", tenDayDu: "Ngân hàng TMCP Á Châu" },
  {
    bin: "970405",
    ten: "Agribank",
    tenDayDu: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  },
  { bin: "970409", ten: "BacABank", tenDayDu: "Ngân hàng TMCP Bắc Á" },
  { bin: "970438", ten: "BaoVietBank", tenDayDu: "Ngân hàng TMCP Bảo Việt" },
  {
    bin: "970418",
    ten: "BIDV",
    tenDayDu: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  },
  {
    bin: "546034",
    ten: "CAKE",
    tenDayDu: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank",
  },
  { bin: "422589", ten: "CIMB", tenDayDu: "Ngân hàng TNHH MTV CIMB Việt Nam" },
  { bin: "970446", ten: "COOPBANK", tenDayDu: "Ngân hàng Hợp tác xã Việt Nam" },
  {
    bin: "970431",
    ten: "Eximbank",
    tenDayDu: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
  },
  {
    bin: "970437",
    ten: "HDBank",
    tenDayDu: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
  },
  {
    bin: "668888",
    ten: "KBank",
    tenDayDu: "Ngân hàng Đại chúng TNHH Kasikornbank",
  },
  { bin: "970452", ten: "KienLongBank", tenDayDu: "Ngân hàng TMCP Kiên Long" },
  {
    bin: "970449",
    ten: "LPBank",
    tenDayDu: "Ngân hàng TMCP Lộc Phát Việt Nam",
  },
  { bin: "970422", ten: "MBBank", tenDayDu: "Ngân hàng TMCP Quân đội" },
  {
    bin: "970414",
    ten: "MBV",
    tenDayDu: "Ngân hàng TNHH MTV Việt Nam Hiện Đại",
  },
  { bin: "971025", ten: "MoMo", tenDayDu: "CTCP Dịch Vụ Di Động Trực Tuyến" },
  { bin: "970426", ten: "MSB", tenDayDu: "Ngân hàng TMCP Hàng Hải Việt Nam" },
  { bin: "970428", ten: "NamABank", tenDayDu: "Ngân hàng TMCP Nam Á" },
  { bin: "970419", ten: "NCB", tenDayDu: "Ngân hàng TMCP Quốc Dân" },
  { bin: "970448", ten: "OCB", tenDayDu: "Ngân hàng TMCP Phương Đông" },
  {
    bin: "970430",
    ten: "PGBank",
    tenDayDu: "Ngân hàng TMCP Thịnh vượng và Phát triển",
  },
  {
    bin: "970412",
    ten: "PVcomBank",
    tenDayDu: "Ngân hàng TMCP Đại Chúng Việt Nam",
  },
  {
    bin: "971133",
    ten: "PVcomBank Pay",
    tenDayDu: "Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số",
  },
  {
    bin: "970403",
    ten: "Sacombank",
    tenDayDu: "Ngân hàng TMCP Sài Gòn Thương Tín",
  },
  {
    bin: "970400",
    ten: "SaigonBank",
    tenDayDu: "Ngân hàng TMCP Sài Gòn Công Thương",
  },
  { bin: "970429", ten: "SCB", tenDayDu: "Ngân hàng TMCP Sài Gòn" },
  { bin: "970440", ten: "SeABank", tenDayDu: "Ngân hàng TMCP Đông Nam Á" },
  { bin: "970443", ten: "SHB", tenDayDu: "Ngân hàng TMCP Sài Gòn - Hà Nội" },
  {
    bin: "970424",
    ten: "ShinhanBank",
    tenDayDu: "Ngân hàng TNHH MTV Shinhan Việt Nam",
  },
  {
    bin: "970407",
    ten: "Techcombank",
    tenDayDu: "Ngân hàng TMCP Kỹ thương Việt Nam",
  },
  {
    bin: "963388",
    ten: "Timo",
    tenDayDu: "Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)",
  },
  { bin: "970423", ten: "TPBank", tenDayDu: "Ngân hàng TMCP Tiên Phong" },
  {
    bin: "546035",
    ten: "Ubank",
    tenDayDu: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank",
  },
  { bin: "970441", ten: "VIB", tenDayDu: "Ngân hàng TMCP Quốc tế Việt Nam" },
  { bin: "970427", ten: "VietABank", tenDayDu: "Ngân hàng TMCP Việt Á" },
  {
    bin: "970433",
    ten: "VietBank",
    tenDayDu: "Ngân hàng TMCP Việt Nam Thương Tín",
  },
  {
    bin: "970454",
    ten: "VietCapitalBank",
    tenDayDu: "Ngân hàng TMCP Bản Việt",
  },
  {
    bin: "970436",
    ten: "Vietcombank",
    tenDayDu: "Ngân hàng TMCP Ngoại Thương Việt Nam",
  },
  {
    bin: "970415",
    ten: "VietinBank",
    tenDayDu: "Ngân hàng TMCP Công thương Việt Nam",
  },
  {
    bin: "970432",
    ten: "VPBank",
    tenDayDu: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
  },
  {
    bin: "970457",
    ten: "Woori",
    tenDayDu: "Ngân hàng TNHH MTV Woori Việt Nam",
  },
];

export function timNganHang(
  bin: string | null | undefined,
): NganHang | undefined {
  if (!bin) return undefined;
  return DANH_SACH_NGAN_HANG.find((n) => n.bin === bin);
}
