import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  ROLE_BADGE_CLASS,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  ROLE_PERMISSIONS,
  can,
  canAny,
  permissionsOf,
  toAccountRole,
  toAppRole,
  type Principal,
  type Role,
} from "./roles";

/**
 * Phân quyền phía giao diện.
 *
 * Bảng ở đây là BẢN SAO của CustomUserDetails.ROLE_PERMISSIONS bên backend, và
 * hai bản sao thì sớm muộn lệch nhau. Bộ kiểm này không thể so với backend (nó
 * ở repo khác), nhưng nó chốt lại những luật mà hai bên đã thống nhất, để một
 * lần sửa vội ở đây không âm thầm cho người dùng thấy nút họ bấm vào sẽ nhận
 * 403 — hoặc tệ hơn, giấu mất nút họ thực sự dùng được.
 */
describe("Đổi vai trò của backend sang vai trò giao diện", () => {
  it("bốn vai trò thật đều đổi được", () => {
    expect(toAppRole("USER")).toBe("user");
    expect(toAppRole("STAFF")).toBe("staff");
    expect(toAppRole("MANAGER")).toBe("manager");
    expect(toAppRole("ADMIN")).toBe("admin");
  });

  it("chưa đăng nhập hoặc vai trò lạ thì là khách", () => {
    expect(toAppRole(null)).toBe("guest");
    expect(toAppRole(undefined)).toBe("guest");
    expect(toAppRole("SIEU_NHAN")).toBe("guest");
  });

  it('vai trò "READER" cũ vẫn đổi được thành staff', () => {
    // READER đã bị bỏ ở migration V2_15 (gộp vào STAFF). Nhánh này giữ lại có
    // chủ ý: phiên đăng nhập cũ còn cache user cũ trong localStorage, và nếu
    // trả "guest" thì họ bị khoá sạch giao diện cho tới khi tự đăng xuất rồi
    // đăng nhập lại — không ai đoán ra phải làm thế.
    expect(toAppRole("READER")).toBe("staff");
  });

  it("đổi ngược lại được, trừ khách", () => {
    expect(toAccountRole("admin")).toBe("ADMIN");
    expect(toAccountRole("staff")).toBe("STAFF");
    // Khách không có trong bảng users nên không có giá trị nào để gửi lên.
    expect(toAccountRole("guest")).toBeNull();
  });
});

describe("Quyền theo vai trò", () => {
  it("khách chưa đăng nhập không có quyền nào", () => {
    expect(permissionsOf(null)).toEqual([]);
    expect(can(null, "USER_BASIC")).toBe(false);
  });

  it("cấp trên KHÔNG tự thừa kế quyền cấp dưới", () => {
    // Giống hệt bên backend. Đây là chỗ dễ "sửa cho tiện" nhất, và sửa là hỏng
    // hai luật bên dưới cùng lúc.
    expect(can({ role: "manager" }, "SUPPORT_RESPOND")).toBe(false);
    expect(can({ role: "admin" }, "READER_APPLY")).toBe(false);
  });

  it("quản lý giám sát chứ không trực tiếp trả lời khách", () => {
    expect(can({ role: "manager" }, "SUPPORT_VIEW")).toBe(true);
    expect(can({ role: "manager" }, "SUPPORT_RESPOND")).toBe(false);
  });

  it("tiền là việc của quản trị viên, không phải quản lý", () => {
    expect(can({ role: "manager" }, "PAYMENTS_MANAGE")).toBe(false);
    expect(can({ role: "manager" }, "ORDERS_MANAGE")).toBe(false);
    expect(can({ role: "admin" }, "PAYMENTS_MANAGE")).toBe(true);
    expect(can({ role: "admin" }, "ORDERS_MANAGE")).toBe(true);
  });

  it("gian hàng thuộc quản lý, KHÔNG thuộc nhân viên", () => {
    // Nhân viên chính là Reader đang tư vấn. Để họ tự chọn sản phẩm đẩy lên
    // trước mặt khách của mình là đặt họ vào thế xung đột lợi ích.
    expect(can({ role: "staff" }, "CATALOG_MANAGE")).toBe(false);
    expect(can({ role: "manager" }, "CATALOG_MANAGE")).toBe(true);
  });

  it("người duyệt lệnh rút KHÔNG phải người xin rút", () => {
    expect(can({ role: "staff" }, "PAYOUT_REQUEST")).toBe(true);
    expect(can({ role: "staff" }, "PAYOUT_REVIEW")).toBe(false);
    expect(can({ role: "admin" }, "PAYOUT_REVIEW")).toBe(true);
    expect(can({ role: "admin" }, "PAYOUT_REQUEST")).toBe(false);
  });

  it("chỉ quản trị viên đọc được nhật ký thao tác", () => {
    expect(can({ role: "admin" }, "AUDIT_VIEW")).toBe(true);
    expect(can({ role: "manager" }, "AUDIT_VIEW")).toBe(false);
  });

  it("mọi tài khoản đã đăng nhập đều có USER_BASIC", () => {
    const daDangNhap: Role[] = ["user", "staff", "manager", "admin"];
    for (const role of daDangNhap) {
      expect(can({ role }, "USER_BASIC")).toBe(true);
    }
  });
});

describe("Danh sách quyền do backend cấp thắng bản sao ở đây", () => {
  it("có permissions từ backend thì dùng cái đó", () => {
    const nguoiDung: Principal = {
      role: "user",
      permissions: ["USERS_MANAGE"],
    };

    // Backend mới là thứ thực sự quyết định API cho hay không. Bản sao ở đây
    // chỉ là lưới an toàn cho khách chưa đăng nhập và cho backend cũ chưa trả
    // trường `permissions`.
    expect(can(nguoiDung, "USERS_MANAGE")).toBe(true);
    expect(can(nguoiDung, "USER_BASIC")).toBe(false);
  });

  it("permissions rỗng thì rơi về bản sao theo vai trò", () => {
    // Backend cũ trả mảng rỗng hoặc không trả trường này. Coi mảng rỗng là
    // "không có quyền nào" sẽ khoá sạch giao diện của người đăng nhập hợp lệ.
    expect(can({ role: "admin", permissions: [] }, "USERS_MANAGE")).toBe(true);
  });

  it("vai trò lạ thì rơi về quyền của khách, không nổ", () => {
    const la = { role: "sieu_nhan" as Role };
    expect(permissionsOf(la)).toEqual([]);
  });
});

describe("canAny", () => {
  it("đúng khi có ÍT NHẤT một quyền trong danh sách", () => {
    expect(canAny({ role: "manager" }, ["PAYMENTS_MANAGE", "STAFF_VIEW"])).toBe(
      true,
    );
  });

  it("sai khi không có quyền nào", () => {
    expect(
      canAny({ role: "user" }, ["PAYMENTS_MANAGE", "USERS_MANAGE"]),
    ).toBe(false);
  });

  it("danh sách rỗng là sai, không phải đúng", () => {
    // "Có quyền nào trong tập rỗng không?" phải trả lời là không. Trả true sẽ
    // mở mọi menu khai thiếu quyền.
    expect(canAny({ role: "admin" }, [])).toBe(false);
  });
});

describe("Nhãn hiển thị", () => {
  it("mọi vai trò đều có nhãn, mô tả và màu chip", () => {
    // Thiếu một vai trò ở bất kỳ bảng nào thì giao diện hiện "undefined" ở
    // đúng chỗ người dùng đang đọc để chọn vai trò trao cho người khác.
    for (const role of APP_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(ROLE_DESCRIPTION[role]).toBeTruthy();
      expect(ROLE_BADGE_CLASS[role]).toBeTruthy();
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("mỗi vai trò một màu, không trùng nhau", () => {
    const mau = APP_ROLES.map((r) => ROLE_BADGE_CLASS[r]);
    expect(new Set(mau).size).toBe(APP_ROLES.length);
  });
});
