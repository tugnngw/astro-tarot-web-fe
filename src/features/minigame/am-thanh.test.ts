import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AM_MAC_DINH,
  bacCuaBuoc,
  nuaCungCuaBac,
  cauHoCuaBac,
  cauHoCuaKiNang,
  docCaiDat,
  hopAmCuaBac,
  kepMuc,
  luuCaiDat,
  tanSoBuoc,
} from "./am-thanh";

describe("kepMuc", () => {
  it("giữ nguyên mức hợp lệ", () => {
    expect(kepMuc(0)).toBe(0);
    expect(kepMuc(0.5)).toBe(0.5);
    expect(kepMuc(1)).toBe(1);
  });

  it("kéo mức ngoài khoảng về trong khoảng", () => {
    expect(kepMuc(-3)).toBe(0);
    expect(kepMuc(42)).toBe(1);
  });

  it("số không phải số thì về mặc định", () => {
    // Giá trị này tới từ localStorage, tức là từ bên ngoài. NaN lọt qua thì
    // `gain.value = NaN` làm cả đồ thị âm thanh câm, không báo lỗi gì.
    expect(kepMuc(Number.NaN)).toBe(AM_MAC_DINH.muc);
    expect(kepMuc(Number.POSITIVE_INFINITY)).toBe(AM_MAC_DINH.muc);
  });
});

describe("docCaiDat", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("chưa lưu gì thì ra mặc định", () => {
    expect(docCaiDat()).toEqual(AM_MAC_DINH);
  });

  it("đọc lại đúng thứ vừa lưu", () => {
    luuCaiDat({ bat: false, muc: 0.3 });
    expect(docCaiDat()).toEqual({ bat: false, muc: 0.3 });
  });

  it("chuỗi hỏng thì ra mặc định chứ không ném lỗi", () => {
    localStorage.setItem("giaohoi.am", "{khong phai json");
    expect(docCaiDat()).toEqual(AM_MAC_DINH);
  });

  it("thiếu trường thì lấy mặc định cho đúng trường ấy", () => {
    localStorage.setItem("giaohoi.am", JSON.stringify({ bat: false }));
    expect(docCaiDat()).toEqual({ bat: false, muc: AM_MAC_DINH.muc });
  });

  it("mức đã lưu nằm ngoài khoảng thì bị kéo về", () => {
    localStorage.setItem("giaohoi.am", JSON.stringify({ bat: true, muc: 9 }));
    expect(docCaiDat().muc).toBe(1);
  });

  it("localStorage ném lỗi thì vẫn chạy được", () => {
    // Cửa sổ ẩn danh và trình duyệt chặn dữ liệu trang đều ném ở đây. Không
    // bọc thì cả trang trò chơi trắng xoá chỉ vì không đọc được cài đặt âm.
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("bị chặn");
      },
      setItem() {
        throw new Error("bị chặn");
      },
    });
    expect(docCaiDat()).toEqual(AM_MAC_DINH);
    expect(() => luuCaiDat({ bat: true, muc: 0.5 })).not.toThrow();
  });
});

describe("tanSoBuoc", () => {
  it("bậc đầu giữ nguyên nốt gốc", () => {
    expect(tanSoBuoc(330, 0)).toBeCloseTo(330, 5);
  });

  it("leo theo bậc ngũ cung chứ không leo đều", () => {
    expect(tanSoBuoc(330, 1) / 330).toBeCloseTo(Math.pow(2, 3 / 12), 5);
    expect(tanSoBuoc(330, 2) / 330).toBeCloseTo(Math.pow(2, 5 / 12), 5);
  });

  it("luôn đi lên khi dây chuyền dài ra", () => {
    for (let b = 1; b <= 7; b++) {
      expect(tanSoBuoc(330, b)).toBeGreaterThan(tanSoBuoc(330, b - 1));
    }
  });

  it("chặn trên để dây chuyền dài không leo lên tới chỗ chói tai", () => {
    // Máy chủ không hứa dây chuyền dài tối đa bao nhiêu. Không chặn thì một
    // dây chuyền mười hai bậc kết thúc ở quãng tám thứ bảy — nghe như còi.
    expect(tanSoBuoc(330, 20)).toBe(tanSoBuoc(330, 7));
    expect(tanSoBuoc(330, 7)).toBeLessThan(330 * 3);
  });

  it("MỌI nốt của MỌI bậc đều rút từ cùng một âm giai ngũ cung", () => {
    // Đây là lời hứa thật của cả bộ âm, và nó chỉ đúng khi cả hai thứ cùng
    // đúng: thang leo của dây chuyền VÀ hợp âm của từng bậc nổ. Sửa một
    // trong hai mà quên cái kia là có hai nốt cách nhau nửa cung vang chồng
    // lên nhau — tai nghe ra là sai, dù không ai gọi tên được.
    const NGU_CUNG = new Set([0, 3, 5, 7, 10]);
    for (let buoc = 0; buoc < 10; buoc++) {
      const bacDau = bacCuaBuoc(buoc);
      for (const bac of [0, 1, 2, 3] as const) {
        for (const lech of hopAmCuaBac(bac)) {
          // Cộng BẬC với BẬC, rồi mới đổi ra nửa cung. Đây chính là phép
          // tính mà bộ phát tiếng làm; cộng kiểu khác là test không còn
          // kiểm thứ đang chạy thật.
          const nuaCung = ((nuaCungCuaBac(bacDau + lech) % 12) + 12) % 12;
          expect(
            NGU_CUNG.has(nuaCung),
            `bước ${buoc}, bậc ${bac}, lệch ${lech} → ${nuaCung}`,
          ).toBe(true);
        }
      }
    }
  });

  it("nuaCungCuaBac leo đúng quãng tám và nhận cả bậc âm", () => {
    expect(nuaCungCuaBac(0)).toBe(0);
    expect(nuaCungCuaBac(4)).toBe(10);
    // Hết năm bậc là sang quãng tám mới.
    expect(nuaCungCuaBac(5)).toBe(12);
    expect(nuaCungCuaBac(9)).toBe(22);
    // Bậc âm không được ra NaN: `hz()` chia hai quãng tám cho tiếng trầm,
    // và một ngày nào đó có người truyền thẳng bậc âm vào đây.
    expect(Number.isFinite(nuaCungCuaBac(-1))).toBe(true);
    expect(nuaCungCuaBac(-1)).toBe(-2);
    expect(nuaCungCuaBac(-5)).toBe(-12);
  });

  it("bậc âm không kéo tụt xuống dưới nốt gốc", () => {
    expect(tanSoBuoc(330, -5)).toBe(330);
  });
});

describe("hopAmCuaBac", () => {
  it("nổ càng lớn hợp âm càng dày", () => {
    expect(hopAmCuaBac(0)).toHaveLength(1);
    for (const b of [1, 2, 3] as const) {
      expect(hopAmCuaBac(b).length).toBeGreaterThan(
        hopAmCuaBac((b - 1) as 0 | 1 | 2).length,
      );
    }
  });

  it("mọi nốt đều nằm trong ngũ cung tính từ gốc", () => {
    // Các bậc của một dây chuyền chồng tiếng lên nhau. Lọt một quãng nửa
    // cung vào đây là sớm muộn có hai nốt cách nhau nửa cung vang cùng lúc.
    const NGU_CUNG = new Set([0, 3, 5, 7, 10]);
    for (const b of [0, 1, 2, 3] as const) {
      for (const n of hopAmCuaBac(b)) {
        expect(NGU_CUNG.has(((n % 12) + 12) % 12)).toBe(true);
      }
    }
  });

  it("nốt gốc luôn có mặt và luôn đứng đầu", () => {
    for (const b of [0, 1, 2, 3] as const) {
      expect(hopAmCuaBac(b)[0]).toBe(0);
    }
  });
});

describe("cauHoCuaBac", () => {
  it("chuỗi ba thường thì im", () => {
    // Hô ở mọi nước đi thì chẳng nước nào còn đáng kể.
    expect(cauHoCuaBac(0, 0)).toBeNull();
  });

  it("mỗi bậc nổ có tên riêng", () => {
    expect(cauHoCuaBac(1, 0)).toBe("tam-hop");
    expect(cauHoCuaBac(2, 0)).toBe("thien-trieu");
    expect(cauHoCuaBac(3, 0)).toBe("tinh-ha");
  });

  it("dây chuyền dài giành quyền nói, kể cả khi cú nổ chỉ là chuỗi ba", () => {
    expect(cauHoCuaBac(0, 2)).toBe("tuyet-voi");
    expect(cauHoCuaBac(0, 4)).toBe("khong-the-tin");
    expect(cauHoCuaBac(3, 4)).toBe("khong-the-tin");
  });

  it("không bao giờ trả về hai câu", () => {
    // Kiểu trả về đã chặn chuyện này, nhưng test ghi lại Ý ĐỊNH: một sự kiện
    // một câu. Ai đổi sang mảng thì phải đọc dòng này trước.
    for (let bac = 0; bac <= 3; bac++) {
      for (let buoc = 0; buoc < 8; buoc++) {
        const r = cauHoCuaBac(bac as 0 | 1 | 2 | 3, buoc);
        expect(r === null || typeof r === "string").toBe(true);
      }
    }
  });
});

describe("cauHoCuaKiNang", () => {
  it("mỗi người đồng hành gọi tên chiêu của mình", () => {
    expect(cauHoCuaKiNang("LUNA")).toBe("trieu-am");
    expect(cauHoCuaKiNang("SOL")).toBe("quang-phat");
    expect(cauHoCuaKiNang("ASTRA")).toBe("thap-tinh");
  });

  it("nhân vật lạ thì im chứ không nổ", () => {
    // Mã nhân vật tới từ máy chủ. Thêm người đồng hành thứ tư ở đó mà quên
    // thu tiếng thì chỗ này phải im lặng bỏ qua, không được ném lỗi giữa ván.
    expect(cauHoCuaKiNang("NGUOI_MOI")).toBeNull();
    expect(cauHoCuaKiNang("")).toBeNull();
  });
});
