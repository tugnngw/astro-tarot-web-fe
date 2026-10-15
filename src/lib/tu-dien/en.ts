// Bản dịch tiếng Anh, tra theo chính câu tiếng Việt.
//
// Thiếu câu nào thì câu ấy hiện nguyên tiếng Việt — xem `ngon-ngu.tsx` để
// biết vì sao chọn cách này thay vì mã khoá.
//
// Chạy `node scripts/thieu-ban-dich.mjs` để liệt kê những chuỗi đã bọc `t()`
// mà chưa có ở đây.
//
// Quy ước: giữ nguyên "Reader", "Tarot", "ASTROTAROT" — đó là tên riêng và
// tên vai trò dùng chung cả hai thứ tiếng, dịch ra "card reader" thì mất
// nghĩa trong sản phẩm.

export const EN: Record<string, string> = {
  // ---- Điều hướng, khung chung ----
  "Trang chủ": "Home",
  "Bản đồ sao": "Star chart",
  "Gói cước AI": "AI plans",
  "Ví ASTROTAROT": "ASTROTAROT Wallet",
  "Hồ sơ cá nhân": "My profile",
  "Cài đặt tài khoản": "Account settings",
  "Lịch sử trải bài": "Reading history",
  "Lịch hẹn của tôi": "My bookings",
  "Lịch hẹn": "Bookings",
  "Lịch khách đặt với tôi": "Bookings with me",
  "Không gian của tôi": "My space",
  "Khu vực Quản trị": "Admin area",
  "Hỗ trợ": "Support",
  "Liên hệ với chúng tôi": "Contact us",
  "Mở menu": "Open menu",
  "Đóng menu": "Close menu",
  "Số dư Ví ASTROTAROT — Bấm để nạp tiền":
    "ASTROTAROT Wallet balance — tap to top up",
  "Bài viết": "Articles",
  "Gian hàng": "Shop",
  "Đăng nhập": "Sign in",
  "Đăng ký": "Sign up",
  "Đăng xuất": "Sign out",

  // ---- Danh sách Reader ----
  "Tìm Reader": "Find a Reader",
  "Reader thật": "Real Readers",
  "Reader mới": "New Reader",
  "Tên Reader hoặc chuyên môn...": "Reader name or speciality...",
  "Chưa có Reader nào": "No Readers yet",
  "Không có Reader nào khớp": "No Readers match",
  "Không tải được danh sách Reader": "Could not load the Reader list",
  "Đặt lịch với các Reader Tarot và Chiêm tinh đã được duyệt.":
    "Book an approved Tarot or astrology Reader.",
  "chỉ từ": "from",
  "tạm ngưng nhận lịch": "not taking bookings",
  "đang nhận lịch": "taking bookings",
  "Chưa có đánh giá": "No reviews yet",
  "Chưa đặt giá": "No price set",
  "Reader chưa đặt giá cho mốc này": "This Reader has no price for this length",
  "năm kinh nghiệm": "years of experience",
  "Quay lại danh sách Reader": "Back to the Reader list",
  "Xem hồ sơ và đặt lịch": "View profile and book",

  // ---- Đặt lịch ----
  "Đặt lịch": "Book",
  "Chọn thời lượng": "Choose a length",
  "Chọn ngày": "Choose a day",
  "Chọn giờ": "Choose a time",
  "Khung giờ": "Time slots",
  "Còn trống": "Available",
  "Đã kín": "Taken",
  "Đã qua": "Past",
  Nghỉ: "Off",
  Sáng: "Morning",
  Chiều: "Afternoon",
  Tối: "Evening",
  "Đăng nhập để đặt lịch": "Sign in to book",
  "Không đặt được lịch": "Could not book",
  "Không tải được lịch": "Could not load the calendar",
  "Khung gạch ngang đã có người. Khung còn lại vẫn đặt được.":
    "Struck-through slots are taken. The rest are still open.",
  "Cùng một ngày nhiều người đặt được, miễn khác khung giờ. Khung gạch ngang đã có người.":
    "Several people can book the same day as long as the times differ. Struck-through slots are taken.",
  "Ngày trống gần nhất": "Nearest free day",
  "Reader nghỉ ngày này.": "The Reader is off on this day.",
  "Reader không làm việc ngày này.": "The Reader does not work on this day.",
  "Ngày này đã kín.": "This day is fully booked.",
  "Ngày đã qua.": "This day has passed.",
  "Ngày này không còn khung trống.": "No slots left on this day.",
  "Hôm nay đã qua giờ làm việc của Reader.":
    "The Reader's working hours have ended for today.",
  "Đánh giá từ khách": "Reviews from customers",
  "Chưa có đánh giá nào. Bạn có thể là người đầu tiên.":
    "No reviews yet. You could be the first.",
  phút: "min",

  // ---- Hành động chung ----
  "Thử lại": "Try again",
  "Đã hiểu": "Got it",
  Huỷ: "Cancel",
  Lưu: "Save",
  "Đang gửi…": "Sending…",
  "Đang tải…": "Loading…",
  Gửi: "Send",
  Đóng: "Close",
  "Quay lại": "Back",
  "Tiếp tục": "Continue",
  "Xác nhận": "Confirm",
  "Chưa có": "None yet",

  // ---- Giới thiệu / trang chủ ----
  "Tử vi · Tarot": "Astrology · Tarot",
  "ASTROTAROT — Tử vi · Tarot · Cộng đồng":
    "ASTROTAROT — Astrology · Tarot · Community",
  "ASTROTAROT — Giới thiệu · Tử vi · Tarot AI · Cộng đồng Reader":
    "ASTROTAROT — About · Astrology · AI Tarot · Reader community",
  "Rút bài miễn phí, không cần tài khoản. AI đọc theo câu hỏi và bản đồ sao của bạn.":
    "Draw cards free, no account needed. The AI reads your question and your star chart.",

  // ---- Trò chuyện và cuộc gọi ----
  "Trò chuyện": "Chat",
  "Nhắn tin": "Message",
  Gọi: "Call",
  "đã xem": "seen",
  "Nhập tin nhắn…": "Type a message…",
  "Nhắn tin / Gọi": "Message / Call",

  // ---- Tài khoản, vai trò ----
  "Ngôn ngữ": "Language",
  "Tài khoản": "Account",
  "Tạo tài khoản": "Create account",
  "Xoá tài khoản": "Delete account",
  "Đổi mật khẩu": "Change password",
  "Quay lại đăng nhập": "Back to sign in",
  "Gửi lại mail xác minh": "Resend verification email",
  "Mật khẩu phải từ 8 ký tự": "Password must be at least 8 characters",
  "Email không hợp lệ": "Invalid email",
  "Số điện thoại": "Phone number",
  "Địa chỉ": "Address",
  "Ngày sinh": "Date of birth",
  "Giờ sinh": "Time of birth",
  "Nơi sinh": "Place of birth",
  "Đăng ký làm Reader": "Apply to be a Reader",
  "Góp ý": "Feedback",
  "Của tôi": "Mine",
  "Gói AI": "AI plans",

  // Tên vai trò. Giữ "Reader" nguyên văn, còn lại dịch.
  Khách: "Customer",
  "Người dùng": "User",
  "Nhân viên": "Staff",
  "Quản trị viên": "Administrator",
  "Quản lý": "Manager",
  "Thành viên": "Member",
  "Bàn làm việc": "Workspace",
  "Khu quản trị": "Admin area",
  "Hồ sơ Reader": "Reader profile",

  // ---- Trạng thái ----
  "Chờ duyệt": "Pending review",
  "Bị từ chối": "Rejected",
  "Đã huỷ": "Cancelled",
  "Hoàn tất": "Completed",
  "Đang hoạt động": "Active",
  "Tất cả": "All",
  "Miễn phí": "Free",
  "Quá khứ": "Past",
  "Hiện tại": "Present",
  "Tương lai": "Future",
  "Tác giả": "Author",

  // ---- Hành động ----
  Duyệt: "Approve",
  "Từ chối": "Reject",
  Xoá: "Delete",
  Thêm: "Add",
  Thôi: "Never mind",
  Hủy: "Cancel",
  "Sửa thông tin": "Edit details",
  "Thêm sản phẩm": "Add product",
  "Đổi vai trò": "Change role",
  "Đổi trạng thái": "Change status",
  "Yêu cầu rút tiền": "Request payout",
  "Phiên mới": "New session",

  // ---- Câu báo lỗi dùng lại nhiều chỗ ----
  "Thao tác không thành công.": "That did not work.",
  "Việc này không hoàn tác được.": "This cannot be undone.",
  "Không tải được hồ sơ Reader.": "Could not load the Reader profile.",
  "Đang mở thanh toán…": "Opening payment…",

  // ---- Màn đăng nhập ----
  "Đăng nhập để đặt lịch và trò chuyện với Reader":
    "Sign in to book and chat with a Reader",
  "Mật khẩu": "Password",
  "Xem Reader trước khi đăng nhập": "Browse Readers without signing in",
  "Quên mật khẩu": "Forgot password",
  "Tôi có liên kết trong email": "I have a link in my email",
  "Hãy nhập mật khẩu": "Enter your password",
  "Email chưa đúng định dạng": "That email does not look right",
  "Hiện mật khẩu": "Show password",
  "Ẩn mật khẩu": "Hide password",
  "Gửi lại thư xác minh": "Resend the verification email",
  "Không gửi lại được thư xác minh.":
    "Could not resend the verification email.",

  // ---- Trang chủ, trải bài Tarot ----
  "Ba lá": "Three cards",
  "Thông điệp": "Message",
  "Trải bài": "Draw",
  xuôi: "upright",
  ngược: "reversed",
  "Xem tất cả": "See all",
  "Bản đồ sao của bạn": "Your star chart",

  // ---- Báo cáo nội dung AI ----
  "Báo cáo": "Report",
  "Báo cáo nội dung": "Report content",
  "Báo cáo nội dung này": "Report this content",
  "Thông tin sai lệch": "Misleading information",
  "Xúc phạm, thù ghét": "Abusive or hateful",
  "Nguy hiểm, khuyến khích làm hại": "Dangerous, encourages harm",
  "Lý do khác": "Another reason",
  "Mô tả thêm (không bắt buộc)": "Tell us more (optional)",
  "Đã nhận báo cáo. Cảm ơn bạn.": "Report received. Thank you.",

  // ---- Lịch hẹn ----
  "Chưa có lịch hẹn nào": "No bookings yet",
  "Huỷ lịch": "Cancel booking",
  "Xác nhận huỷ": "Confirm cancellation",
  "Buổi này chưa đặt cọc. Huỷ lúc này không mất tiền.":
    "No deposit has been paid for this session. Cancelling now costs nothing.",
  "Đã huỷ lịch hẹn": "Booking cancelled",
  "Ví dụ: mình có việc đột xuất...": "For example: something came up...",
  "Đánh giá": "Review",
  "Chưa thanh toán": "Unpaid",
  "Đã thanh toán": "Paid",
  "Đã nhận": "Received",

  // ---- Hồ sơ cá nhân ----
  "Lưu hồ sơ": "Save profile",
  "Đã lưu hồ sơ": "Profile saved",
  "Họ và tên": "Full name",
  "Tên đăng nhập": "Username",
  "Giới tính": "Gender",
  Nữ: "Female",
  Khác: "Other",
  "Không tiết lộ": "Prefer not to say",
  "Quốc gia": "Country",
  "Chưa chọn": "Not chosen",
  "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0":
    "A phone number has 10 digits and starts with 0",
  "Xác minh email": "Verify email",
  "Đổi ảnh": "Change photo",
  "Giới thiệu": "About",
  "Đơn làm Reader đang chờ duyệt": "Your Reader application is under review",
  "Đơn làm Reader chưa được duyệt": "Your Reader application was not approved",
  "Thông báo": "Notifications",

  // ---- Bản đồ sao / hồ sơ chiêm tinh ----
  "Bản đồ sao của tôi": "My star chart",
  "Bạn chưa có hồ sơ chiêm tinh nào": "You have no astrology profile yet",
  "Thêm hồ sơ": "Add profile",
  "Tạo hồ sơ": "Create profile",
  "Sửa hồ sơ": "Edit profile",
  "Xoá hồ sơ": "Delete profile",
  "Tên hồ sơ": "Profile name",
  "Hồ sơ chính": "Main profile",
  "Đặt làm hồ sơ chính": "Set as main profile",
  "Hồ sơ của ai": "Whose profile",
  "Tên người được xem": "Name of the person",
  "Chưa biết giờ": "Time unknown",
  "Không biết giờ sinh": "I do not know my birth time",
  "Múi giờ": "Time zone",
  "Toạ độ": "Coordinates",
  "Không lưu được hồ sơ.": "Could not save the profile.",
  "Không xoá được hồ sơ.": "Could not delete the profile.",
  "Không tải được danh sách hồ sơ. Thử lại sau.":
    "Could not load your profiles. Try again later.",
  "Không bắt buộc": "Optional",

  // ---- Danh sách và hồ sơ Reader ----
  "Thử từ khoá khác nhé.": "Try a different keyword.",
  "đánh giá": "reviews",
  "Đã đặt lịch": "Booked",

  // ---- Gói AI, ví, thanh toán ----
  "Chọn gói": "Choose a plan",
  "Số dư ví": "Wallet balance",
  "Nạp tiền": "Top up",
  "Số tiền": "Amount",
  "Chuyển khoản": "Bank transfer",
  "Ngân hàng": "Bank",
  "Số tài khoản": "Account number",
  "Chủ tài khoản": "Account holder",
  "Nội dung chuyển khoản": "Transfer reference",
  "Chuyển đúng số tiền và đúng nội dung bên dưới. Chúng tôi đối soát rồi xác nhận, thường trong vài giờ làm việc.":
    "Transfer the exact amount with the exact reference below. We reconcile and confirm, usually within a few working hours.",
  "Chưa cấu hình": "Not configured",
  "Tôi đã chuyển khoản": "I have made the transfer",
  "Thanh toán PayOS": "PayOS payment",
  "Thanh toán với PayOS": "Pay with PayOS",
  "Mã đơn PayOS": "PayOS order code",
  "Mở PayOS để quét VietQR hoặc chuyển khoản. Hệ thống xác nhận tự động sau khi nhận tiền.":
    "Open PayOS to scan the VietQR code or transfer. Payment is confirmed automatically once received.",
  "Quét bằng ứng dụng ngân hàng — số tiền và nội dung đã điền sẵn.":
    "Scan with your banking app — the amount and reference are filled in already.",
  "Đóng — trạng thái cập nhật ở trang Lịch hẹn":
    "Close — the status updates on the Bookings page",
  "Bạn thanh toán toàn bộ một lần, không đặt cọc.":
    "You pay the full amount at once, with no deposit.",
  "Đây là 50% còn lại. Reader đọc xong thì chuyển khoản nốt số này.":
    "This is the remaining 50%. Transfer it once the Reader has finished.",

  // ---- Màn Tài khoản ----
  "Khám phá": "Explore",
  "Khu quản lý": "Management area",
  "Chính sách riêng tư": "Privacy policy",
  "Nguồn ảnh": "Image credits",
  "Nhập mật khẩu để xác nhận": "Enter your password to confirm",
  bạn: "you",
  "Ngày này đã qua giờ làm việc.": "That day's working hours have ended.",

  // ---- Đăng ký, quên mật khẩu, liên kết trong email ----
  "Mật khẩu mới": "New password",
  "Đặt mật khẩu mới": "Set a new password",
  "Nhập lại mật khẩu mới": "Repeat the new password",
  "Mật khẩu nhập lại không khớp": "The repeated password does not match",
  "Gửi liên kết": "Send link",
  Dán: "Paste",
  "Xác minh": "Verify",

  // ---- Bài viết ----
  "Tìm bài viết, tác giả...": "Search articles or authors...",
  "Chưa có bài viết nào": "No articles yet",

  // ---- Gian hàng ----
  "Sản phẩm": "Product",
  "Không tìm thấy sản phẩm": "Product not found",
  "Thử từ khoá khác hoặc bỏ bộ lọc.":
    "Try another keyword or clear the filter.",
  "Sản phẩm này có thể đã ngừng bán hoặc đường dẫn không đúng.":
    "This product may be discontinued, or the link is wrong.",
  "Ảnh minh hoạ": "Illustrative photo",

  // ---- Hỗ trợ ----
  "Gửi yêu cầu": "Send request",

  // ---- Góp ý ----
  "Gửi phản hồi": "Send feedback",
  "ASTROTAROT có giúp bạn không?": "Is ASTROTAROT helping you?",
  "Đánh giá trải nghiệm (tuỳ chọn)": "Rate your experience (optional)",

  // ---- Thông báo ----
  "Chưa có thông báo nào": "No notifications yet",
  "Ghim lên đầu": "Pin to top",
  "Bỏ ghim": "Unpin",
  "Không đổi được trạng thái.": "Could not change the status.",
  "Tìm bộ bài, đá, phụ kiện...": "Search decks, crystals, accessories...",
};
