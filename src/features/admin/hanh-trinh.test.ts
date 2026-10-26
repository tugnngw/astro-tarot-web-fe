import { describe, expect, it } from "vitest";
import type { BuocHanhTrinh, HanhTrinhKhach } from "@/api/marketing";
import {
  BO_LOC_RONG,
  khacNgay,
  khoangThoiGian,
  cacHanhDong,
  cacNguon,
  chiTietBuoc,
  coLocDangBat,
  gomBuocLienTiep,
  locHanhTrinh,
  nhanNhom,
  tabTuMetadata,
  tenManTuMetadata,
  tenTrang,
} from "./hanh-trinh";

function buoc(
  hanhDong: string,
  duongDan: string | null = null,
  luc = "2026-10-22T05:00:00Z",
  metadata: string | null = null,
): BuocHanhTrinh {
  return { hanhDong, duongDan, luc, metadata };
}

function khach(p: Partial<HanhTrinhKhach> = {}): HanhTrinhKhach {
  return {
    maKhach: "abc123",
    nguon: "(không rõ nguồn)",
    kenh: null,
    chienDich: null,
    tenNguoiDung: null,
    batDau: "2026-10-22T05:00:00Z",
    ketThuc: "2026-10-22T05:10:00Z",
    soHanhDong: 1,
    cacBuoc: [buoc("xem_trang", "/")],
    ...p,
  };
}

describe("tenTrang", () => {
  it("đổi đường dẫn đã biết thành tên đọc được", () => {
    expect(tenTrang("/")).toBe("Trang chủ");
    expect(tenTrang("/profile/wallet")).toBe("Ví");
    expect(tenTrang("/chinh-sach-rieng-tu")).toBe("Chính sách riêng tư");
  });

  it("bỏ tham số truy vấn và dấu gạch chéo thừa", () => {
    expect(tenTrang("/tarot?tab=1")).toBe("Trải bài Tarot");
    expect(tenTrang("/shop/")).toBe("Cửa hàng");
  });

  it("trang có tham số ở cuối thì ghép tên với phần đuôi", () => {
    expect(tenTrang("/blog/chu-de-giai-ma-la-bai")).toBe(
      "Bài viết: Chu de giai ma la bai",
    );
    expect(tenTrang("/readers/abc-def")).toBe("Hồ sơ Reader: Abc def");
  });

  it("đường dẫn của ứng dụng di động đọc theo kiểu màn hình", () => {
    expect(tenTrang("app:man_trai_bai")).toBe("màn man trai bai");
  });

  /**
   * App hôm nay gửi đúng tên sự kiện làm đường dẫn, tức là không kèm tên màn
   * nào. Ghép máy móc thì ra "Xem màn xem man" — vừa thừa vừa khó hiểu.
   */
  it("app chỉ gửi tên sự kiện làm đường dẫn thì nói là không rõ màn", () => {
    expect(tenTrang("app:xem_man")).toBe("trong ứng dụng");
  });

  it("/blog trơ cũng có tên, không rơi về đường dẫn thô", () => {
    expect(tenTrang("/blog")).toBe("Bài viết");
  });

  // Slug bài viết thật dài tới 70 ký tự; để nguyên thì một thẻ nuốt cả dòng.
  it("cắt bớt slug quá dài", () => {
    const ra = tenTrang(
      "/blog/chu-de-giai-ma-la-bai-the-fool-khoi-dau-moi-tren-hanh-trinh-tarot",
    );
    expect(ra.endsWith("…")).toBe(true);
    expect(ra.length).toBeLessThanOrEqual(45);
  });

  it("đường dẫn lạ thì giữ nguyên, không bịa tên", () => {
    expect(tenTrang("/khong-co-trong-bang")).toBe("/khong-co-trong-bang");
  });

  it("thiếu đường dẫn thì nói rõ là không rõ", () => {
    expect(tenTrang(null)).toBe("trang không rõ");
  });
});

describe("chiTietBuoc", () => {
  it("đổi khoá kỹ thuật thành nhãn tiếng Việt", () => {
    expect(
      chiTietBuoc(
        buoc("cta_shopee_click", "/shop", undefined, '{"slug":"bo-bai"}'),
      ),
    ).toBe("sản phẩm: bo-bai");
  });

  it("ghép nhiều khoá bằng dấu chấm giữa", () => {
    const ra = chiTietBuoc(
      buoc("gui_gop_y", "/", undefined, '{"nguon_gop_y":"tarot","sao":5}'),
    );
    expect(ra).toBe("từ màn: tarot · số sao: 5");
  });

  it("bỏ duong_dan vì tên trang đã nói điều đó rồi", () => {
    expect(
      chiTietBuoc(buoc("xem_trang", "/", undefined, '{"duong_dan":"/"}')),
    ).toBeNull();
  });

  // Bản BE cũ không trả metadata. Giao diện phải sống sót khoảng giữa hai lần
  // deploy, nên đây không phải trường hợp hiếm mà là trạng thái bình thường.
  it("thiếu metadata thì trả null chứ không ném", () => {
    expect(chiTietBuoc(buoc("xem_trang", "/"))).toBeNull();
    expect(chiTietBuoc({ ...buoc("xem_trang"), metadata: undefined })).toBeNull();
  });

  it("metadata hỏng thì trả null chứ không làm sập bảng", () => {
    expect(chiTietBuoc(buoc("x", null, undefined, "{khong-phai-json"))).toBeNull();
    expect(chiTietBuoc(buoc("x", null, undefined, '"chuoi"'))).toBeNull();
    expect(chiTietBuoc(buoc("x", null, undefined, "[1,2]"))).toBeNull();
  });
});

describe("gomBuocLienTiep", () => {
  it("gộp những bước giống hệt nhau nằm liền nhau", () => {
    const ra = gomBuocLienTiep([
      buoc("xem_trang", "/admin"),
      buoc("xem_trang", "/admin"),
      buoc("xem_trang", "/admin"),
    ]);
    expect(ra).toHaveLength(1);
    expect(ra[0].soLan).toBe(3);
  });

  /**
   * Chỗ dễ sai nhất: gộp cả những lần cách quãng thì `A A B A` ra `A×3, B` —
   * đúng về số đếm, sai hẳn về câu chuyện. Thứ tự CHÍNH LÀ nội dung.
   */
  it("không gộp những lần cách quãng", () => {
    const ra = gomBuocLienTiep([
      buoc("xem_trang", "/a"),
      buoc("xem_trang", "/a"),
      buoc("xem_trang", "/b"),
      buoc("xem_trang", "/a"),
    ]);
    expect(ra.map((n) => [n.duongDan, n.soLan])).toEqual([
      ["/a", 2],
      ["/b", 1],
      ["/a", 1],
    ]);
  });

  it("cùng hành động nhưng khác chi tiết thì là hai nhóm", () => {
    const ra = gomBuocLienTiep([
      buoc("cta_shopee_click", "/shop", undefined, '{"slug":"mot"}'),
      buoc("cta_shopee_click", "/shop", undefined, '{"slug":"hai"}'),
    ]);
    expect(ra).toHaveLength(2);
  });

  it("giữ mốc đầu và mốc cuối của cả nhóm", () => {
    const ra = gomBuocLienTiep([
      buoc("xem_trang", "/", "2026-10-22T05:00:00Z"),
      buoc("xem_trang", "/", "2026-10-22T05:09:00Z"),
    ]);
    expect(ra[0].dau).toBe("2026-10-22T05:00:00Z");
    expect(ra[0].cuoi).toBe("2026-10-22T05:09:00Z");
  });

  it("danh sách rỗng thì ra rỗng", () => {
    expect(gomBuocLienTiep([])).toEqual([]);
  });
});

describe("nhanNhom", () => {
  it("lượt xem trang thì ghép tên trang vào", () => {
    const [n] = gomBuocLienTiep([buoc("xem_trang", "/tarot")]);
    expect(nhanNhom(n)).toBe("Xem Trải bài Tarot");
  });

  it("hành động khác thì chỉ hiện tên hành động", () => {
    const [n] = gomBuocLienTiep([buoc("rut_bai_tarot", "/tarot")]);
    expect(nhanNhom(n)).toBe("Rút bài");
  });

  it("lượt xem màn của app cũng ghép tên như lượt xem trang", () => {
    const [n] = gomBuocLienTiep([buoc("xem_man", "app:xem_man")]);
    expect(nhanNhom(n)).toBe("Xem trong ứng dụng");
  });

  it("sự kiện lạ thì hiện nguyên tên, không nuốt mất", () => {
    const [n] = gomBuocLienTiep([buoc("su_kien_moi_tinh", null)]);
    expect(nhanNhom(n)).toBe("su_kien_moi_tinh");
  });
});

describe("locHanhTrinh", () => {
  const ds = [
    khach({ maKhach: "aaa111", nguon: "facebook", tenNguoiDung: "Đạt" }),
    khach({
      maKhach: "bbb222",
      nguon: "(không rõ nguồn)",
      cacBuoc: [buoc("xem_trang", "/profile/wallet"), buoc("rut_bai_tarot")],
    }),
  ];

  it("bộ lọc rỗng thì giữ nguyên tất cả", () => {
    expect(locHanhTrinh(ds, BO_LOC_RONG)).toHaveLength(2);
    expect(coLocDangBat(BO_LOC_RONG)).toBe(false);
  });

  it("lọc theo nguồn", () => {
    expect(
      locHanhTrinh(ds, { ...BO_LOC_RONG, nguon: "facebook" }),
    ).toHaveLength(1);
  });

  it("lọc chỉ khách đã đăng nhập", () => {
    const ra = locHanhTrinh(ds, { ...BO_LOC_RONG, chiDangNhap: true });
    expect(ra.map((k) => k.maKhach)).toEqual(["aaa111"]);
  });

  it("lọc theo một hành động cụ thể", () => {
    const ra = locHanhTrinh(ds, { ...BO_LOC_RONG, hanhDong: "rut_bai_tarot" });
    expect(ra.map((k) => k.maKhach)).toEqual(["bbb222"]);
  });

  it("lọc nhóm hành động đáng chú ý", () => {
    const ra = locHanhTrinh(ds, { ...BO_LOC_RONG, hanhDong: "__chu_y__" });
    expect(ra.map((k) => k.maKhach)).toEqual(["bbb222"]);
  });

  /**
   * Ô tìm phải soi được TÊN trang. Bắt gõ đúng `/profile/wallet` thì nó chỉ
   * dùng được bởi người đã thuộc lòng đường dẫn, tức là không ai.
   */
  it("tìm được theo tên trang chứ không chỉ theo đường dẫn", () => {
    expect(locHanhTrinh(ds, { ...BO_LOC_RONG, tim: "ví" })).toHaveLength(1);
    expect(
      locHanhTrinh(ds, { ...BO_LOC_RONG, tim: "/profile/wallet" }),
    ).toHaveLength(1);
  });

  it("tìm theo tên người và mã khách, không phân biệt hoa thường", () => {
    expect(locHanhTrinh(ds, { ...BO_LOC_RONG, tim: "đạt" })).toHaveLength(1);
    expect(locHanhTrinh(ds, { ...BO_LOC_RONG, tim: "BBB222" })).toHaveLength(1);
  });

  it("các bộ lọc cộng dồn với nhau", () => {
    const ra = locHanhTrinh(ds, {
      ...BO_LOC_RONG,
      nguon: "facebook",
      hanhDong: "rut_bai_tarot",
    });
    expect(ra).toEqual([]);
  });
});

describe("đổ dữ liệu cho ô chọn", () => {
  const ds = [
    khach({ nguon: "zalo", cacBuoc: [buoc("gui_gop_y")] }),
    khach({ nguon: "facebook", cacBuoc: [buoc("xem_trang", "/")] }),
    khach({ nguon: "facebook", cacBuoc: [buoc("xem_trang", "/tarot")] }),
  ];

  it("nguồn không trùng lặp", () => {
    expect(cacNguon(ds)).toEqual(["facebook", "zalo"]);
  });

  it("hành động không trùng lặp, sắp theo tên hiển thị", () => {
    expect(cacHanhDong(ds)).toEqual(["gui_gop_y", "xem_trang"]);
  });
});

describe("khoangThoiGian", () => {
  const moc = (phut: number) =>
    new Date(Date.parse("2026-10-22T05:00:00Z") + phut * 60_000).toISOString();

  it("dưới một phút thì nói thẳng là dưới một phút", () => {
    expect(khoangThoiGian(moc(0), moc(0))).toBe("dưới một phút");
  });

  it("vài phút", () => {
    expect(khoangThoiGian(moc(0), moc(7))).toBe("7 phút");
  });

  it("qua một giờ thì tách giờ và phút", () => {
    expect(khoangThoiGian(moc(0), moc(135))).toBe("2 giờ 15 phút");
    expect(khoangThoiGian(moc(0), moc(120))).toBe("2 giờ");
  });

  /**
   * Thẻ dài nhất trên dữ liệu thật kéo 8939 phút. Hai cái đồng hồ giấu hẳn
   * chuyện đó, mà đây mới là thứ phân biệt "ghé lại nhiều lần" với "đang bấm
   * liên tục".
   */
  it("qua một ngày thì tính bằng ngày", () => {
    expect(khoangThoiGian(moc(0), moc(8939))).toBe("6 ngày 4 giờ");
    expect(khoangThoiGian(moc(0), moc(60 * 24 * 2))).toBe("2 ngày");
  });

  it("mốc hỏng thì trả chuỗi rỗng chứ không ném", () => {
    expect(khoangThoiGian("khong-phai-ngay", moc(0))).toBe("");
  });
});

describe("khacNgay", () => {
  it("cùng ngày", () => {
    expect(khacNgay("2026-10-22T01:00:00Z", "2026-10-22T23:00:00Z")).toBe(
      new Date("2026-10-22T01:00:00Z").toDateString() !==
        new Date("2026-10-22T23:00:00Z").toDateString(),
    );
  });

  it("vắt qua nhiều ngày thì khác ngày", () => {
    expect(khacNgay("2026-10-22T05:00:00Z", "2026-10-28T05:00:00Z")).toBe(true);
  });
});

/**
 * Ứng dụng di động gửi MỌI lượt xem màn dưới cùng một đường dẫn
 * `app:xem_man`, và để tên màn thật trong `metadata.man`. Không đọc chỗ ấy
 * thì mọi màn trong app hiện ra giống hệt nhau.
 *
 * Dữ liệu dùng ở đây lấy từ API production ngày 27-10-2026.
 */
describe("tên màn của ứng dụng di động", () => {
  const man = (ten: string) =>
    buoc("xem_man", "app:xem_man", "2026-10-26T23:30:16Z", `{"man": "${ten}"}`);

  it("đọc được tên màn từ metadata", () => {
    expect(tenManTuMetadata(man("Tài khoản"))).toBe("Tài khoản");
  });

  it("thiếu hoặc hỏng thì trả null chứ không ném", () => {
    expect(tenManTuMetadata(buoc("xem_man", "app:xem_man"))).toBeNull();
    expect(
      tenManTuMetadata(buoc("xem_man", "app:xem_man", undefined, "{hong")),
    ).toBeNull();
    expect(
      tenManTuMetadata(buoc("xem_man", "app:xem_man", undefined, '{"man":"  "}')),
    ).toBeNull();
  });

  it("nhãn dùng tên màn thay cho đường dẫn", () => {
    const [n] = gomBuocLienTiep([man("Tài khoản")]);
    expect(nhanNhom(n)).toBe("Xem màn Tài khoản");
  });

  it("không có tên màn thì vẫn nói được là trong ứng dụng", () => {
    const [n] = gomBuocLienTiep([buoc("xem_man", "app:xem_man")]);
    expect(nhanNhom(n)).toBe("Xem trong ứng dụng");
  });

  /**
   * Đây là chỗ tôi suýt kết luận sai: bốn bước này có `hanhDong` và
   * `duongDan` y hệt nhau nên trông như phải gộp, nhưng tên màn xen kẽ nên
   * chúng là bốn bước KHÁC nhau. Gộp lại là nói sai hành trình.
   */
  it("cùng đường dẫn nhưng khác màn thì KHÔNG gộp", () => {
    const ra = gomBuocLienTiep([
      man("mo_app"),
      man("Tài khoản"),
      man("mo_app"),
      man("Tài khoản"),
    ]);
    expect(ra).toHaveLength(4);
    expect(ra.map((n) => nhanNhom(n))).toEqual([
      "Xem màn mo_app",
      "Xem màn Tài khoản",
      "Xem màn mo_app",
      "Xem màn Tài khoản",
    ]);
  });

  it("cùng một màn liên tiếp thì vẫn gộp", () => {
    const ra = gomBuocLienTiep([man("Tài khoản"), man("Tài khoản")]);
    expect(ra).toHaveLength(1);
    expect(ra[0].soLan).toBe(2);
  });

  it("tên màn không lặp lại ở phần chi tiết", () => {
    expect(chiTietBuoc(man("Tài khoản"))).toBeNull();
  });

  it("ô tìm soi được tên màn", () => {
    const ds = [khach({ maKhach: "app001", cacBuoc: [man("Tài khoản")] })];
    expect(locHanhTrinh(ds, { ...BO_LOC_RONG, tim: "tài khoản" })).toHaveLength(
      1,
    );
  });
});

/**
 * Cột `duongDan` chỉ lưu `pathname`, tức là `/admin` cho cả tám tab quản
 * trị — nên bảng nói "Xem Trang quản trị ×11" trong khi người ta đã đi qua
 * bốn tab. Metadata giữ nguyên chuỗi truy vấn nên lấy lại được.
 */
describe("tab đọc từ metadata", () => {
  const xem = (dd: string) =>
    buoc("xem_trang", "/admin", "2026-10-22T05:00:00Z", JSON.stringify({ duong_dan: dd }));

  it("lấy được tab", () => {
    expect(tabTuMetadata(xem("/admin?tab=analytics"))).toBe("analytics");
  });

  it("không có chuỗi truy vấn thì null", () => {
    expect(tabTuMetadata(xem("/admin"))).toBeNull();
  });

  /**
   * Lấy cả chuỗi truy vấn thì mỗi link quảng cáo lại tách trang chủ thành
   * một nhóm riêng — đúng về URL, vô nghĩa về hành trình.
   */
  it("bỏ qua tham số UTM", () => {
    expect(
      tabTuMetadata(xem("/?utm_source=kiemtra&utm_medium=claude&utm_campaign=x")),
    ).toBeNull();
  });

  it("metadata hỏng thì null chứ không ném", () => {
    expect(
      tabTuMetadata(buoc("xem_trang", "/admin", undefined, "{hong")),
    ).toBeNull();
  });

  it("nhãn kèm tab", () => {
    const [n] = gomBuocLienTiep([xem("/admin?tab=analytics")]);
    expect(nhanNhom(n)).toBe("Xem Trang quản trị · tab analytics");
  });

  it("khác tab thì không gộp, cùng tab thì gộp", () => {
    const ra = gomBuocLienTiep([
      xem("/admin?tab=analytics"),
      xem("/admin?tab=analytics"),
      xem("/admin?tab=khuyen-mai"),
    ]);
    expect(ra.map((n) => [n.tab, n.soLan])).toEqual([
      ["analytics", 2],
      ["khuyen-mai", 1],
    ]);
  });

  it("duong_dan không lặp lại ở phần chi tiết", () => {
    expect(chiTietBuoc(xem("/admin?tab=analytics"))).toBeNull();
  });
});
