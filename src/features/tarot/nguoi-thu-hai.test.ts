import { describe, expect, it } from "vitest";
import { nguoiThuHaiCuaPhien, type NguoiTrongForm } from "./nguoi-thu-hai";

/**
 * Form Tarot hỏi dữ liệu của tối đa hai người, nhưng phần gửi đi chỉ lấy
 * `people[0]`. Người thứ hai dừng lại ở trình duyệt, và lời giải trả về là
 * chân dung của riêng người thứ nhất — vẫn trôi chảy, nên không ai thấy
 * thiếu. Người dùng báo: "nó đọc thông tin 2 người mà nó trả về 1".
 */

const trong: NguoiTrongForm = {
  name: "",
  dob: "",
  birthTime: "",
  birthPlace: "",
  timezone: "",
};

const minh: NguoiTrongForm = {
  name: "  Minh  ",
  dob: "03-08-1998",
  birthTime: "21:15",
  birthPlace: " Đà Nẵng ",
  timezone: "Asia/Ho_Chi_Minh",
};

const toi: NguoiTrongForm = {
  name: "Đạt",
  dob: "17-05-2000",
  birthTime: "7:30",
  birthPlace: "Hà Nội",
  timezone: "Asia/Ho_Chi_Minh",
};

describe("nguoiThuHaiCuaPhien", () => {
  it("một người thì không có người thứ hai", () => {
    expect(nguoiThuHaiCuaPhien([toi])).toBeNull();
  });

  it("hai người thì lấy đúng người thứ hai, không phải người thứ nhất", () => {
    const n = nguoiThuHaiCuaPhien([toi, minh]);
    expect(n).not.toBeNull();
    expect(n!.name).toBe("Minh");
    expect(n!.birthDate).toBe("1998-08-03");
    expect(n!.birthTime).toBe("21:15:00");
    expect(n!.birthPlace).toBe("Đà Nẵng");
  });

  it("ô của người thứ hai còn trống trơn thì coi như không có", () => {
    // Bấm "2 người (đôi)" rồi đổi ý mà không bấm lại thì mảng vẫn dài 2.
    // Gửi một người rỗng đi là thêm vào lời nhắc một nhân vật không tồn tại,
    // và mô hình sẽ hỏi ngược lại về họ.
    expect(nguoiThuHaiCuaPhien([toi, trong])).toBeNull();
  });

  it("chỉ có tên, không có ngày sinh — vẫn phải gửi", () => {
    // Người dùng thường không biết ngày sinh của đối phương. Bỏ qua thì lời
    // giải lại quay về một người.
    const n = nguoiThuHaiCuaPhien([toi, { ...trong, name: "Lan" }]);
    expect(n).not.toBeNull();
    expect(n!.name).toBe("Lan");
    expect(n!.birthDate).toBeUndefined();
  });

  it("chỉ có ngày sinh, không có tên — vẫn phải gửi", () => {
    const n = nguoiThuHaiCuaPhien([toi, { ...trong, dob: "03-08-1998" }]);
    expect(n).not.toBeNull();
    expect(n!.birthDate).toBe("1998-08-03");
    expect(n!.name).toBeUndefined();
  });

  it("tên toàn khoảng trắng không làm nên một người", () => {
    expect(nguoiThuHaiCuaPhien([toi, { ...trong, name: "   " }])).toBeNull();
  });

  it("không trả về chuỗi rỗng — máy chủ phải phân biệt được 'không có'", () => {
    // `name: ""` lọt sang máy chủ sẽ in ra "NGƯỜI THỨ HAI — " cụt đuôi.
    const n = nguoiThuHaiCuaPhien([toi, { ...trong, dob: "03-08-1998" }]);
    expect(n!.name).toBeUndefined();
    expect(n!.birthPlace).toBeUndefined();
    expect(n!.timezone).toBeUndefined();
  });

  it("mảng rỗng không làm nổ", () => {
    expect(nguoiThuHaiCuaPhien([])).toBeNull();
  });
});
