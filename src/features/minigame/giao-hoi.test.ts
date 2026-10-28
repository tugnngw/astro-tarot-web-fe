import { describe, expect, it } from "vitest";

import {
  banSauRoi,
  doiHaiO,
  keNhau,
  laKyTuO,
  O_RONG,
  lechKhiKeo,
  MS_GIU_BANG,
  mucDoNo,
  NHIP_GIAM,
  nhipCuaBac,
  NGUONG_RUNG,
  oTheoHuong,
  phanTramNap,
  tamCacO,
  tamTrongBan,
  TI_LE_CHOT,
  tinhDuongRoi,
} from "./giao-hoi";

/**
 * Phần tính toán của hoạt ảnh Giao Hội.
 *
 * ## Vì sao đáng kiểm
 *
 * Trọng lực ở đây phải khớp TỪNG BƯỚC với `Bang.roi()` bên Java. Lệch một
 * bậc thì không có gì đổ: bàn vẫn đúng (bàn do máy chủ gửi), điểm vẫn đúng,
 * chỉ hoạt ảnh kéo ô sai chỗ — ô trượt từ một nơi nó chưa từng ở, rồi nhảy
 * về đúng vị trí ở khung cuối. Nhìn như giật lag, nên dễ bị bỏ qua là "máy
 * chậm" chứ không ai đi tìm lỗi tính toán.
 */

const CANH = 7;

/** Dựng bàn từ các hàng viết tay, mỗi ký tự một ô. */
function ban(...hang: string[]): string {
  expect(hang).toHaveLength(CANH);
  for (const h of hang) expect(h).toHaveLength(CANH);
  return hang.join("");
}

/** Chỉ số ô từ hàng và cột, cùng quy ước với BE: hang * CANH + cot. */
function chiSo(hang: number, cot: number): number {
  return hang * CANH + cot;
}

/** Bàn đầy, không ô nào rỗng. */
const DAY = ban(
  "1234561",
  "2345612",
  "3456123",
  "4561234",
  "5612345",
  "6123456",
  "1234561",
);

describe("keNhau", () => {
  it("chỉ nhận hai ô kề theo cạnh", () => {
    expect(keNhau(0, 1, CANH)).toBe(true);
    expect(keNhau(0, CANH, CANH)).toBe(true);
    expect(keNhau(0, 2, CANH)).toBe(false);
    expect(keNhau(0, 0, CANH)).toBe(false);
  });

  it("không nối hai ô chéo nhau", () => {
    // BE cũng chỉ nhận kề theo cạnh. Cho chéo ở giao diện thì người chơi
    // bấm được một nước mà máy chủ từ chối, và lời từ chối nghe vô lý.
    expect(keNhau(0, CANH + 1, CANH)).toBe(false);
  });

  it("không nối hai mép đối diện của một hàng", () => {
    // Ô cuối hàng 0 (số 6) và ô đầu hàng 1 (số 7) cạnh nhau trong chuỗi
    // nhưng nằm hai đầu bàn. Chỉ so chênh lệch chỉ số là nối sai hai ô ấy.
    expect(keNhau(CANH - 1, CANH, CANH)).toBe(false);
  });
});

describe("tinhDuongRoi", () => {
  it("bàn không mất ô nào thì không ô nào rơi", () => {
    const nguon = tinhDuongRoi(DAY, CANH);
    for (let i = 0; i < CANH * CANH; i++) {
      expect(nguon[i].tuHang).toBe(Math.floor(i / CANH));
    }
  });

  it("xoá ba ô đáy một cột thì ba ô trên tụt xuống ba bậc", () => {
    const sauXoa = ban(
      "1234561",
      "2345612",
      "3456123",
      "4561234",
      "5012345", // mất (4,1)
      "6023456", // mất (5,1)
      "1034561", // mất (6,1)
    );
    const nguon = tinhDuongRoi(sauXoa, CANH);
    const o = (hang: number) => nguon[hang * CANH + 1];

    // Bốn ô còn lại của cột 1 (hàng 0..3) hạ xuống hàng 3..6.
    expect(o(6).tuHang).toBe(3);
    expect(o(5).tuHang).toBe(2);
    expect(o(4).tuHang).toBe(1);
    expect(o(3).tuHang).toBe(0);
    // Ba hàng trên cùng nhận ô mới.
    expect(o(2).tuHang).toBeNull();
    expect(o(1).tuHang).toBeNull();
    expect(o(0).tuHang).toBeNull();
  });

  it("xoá ô giữa cột thì chỉ ô bên TRÊN rơi, ô dưới đứng im", () => {
    const sauXoa = ban(
      "1234561",
      "2345612",
      "3450123", // mất (2,3)
      "4561234",
      "5612345",
      "6123456",
      "1234561",
    );
    const nguon = tinhDuongRoi(sauXoa, CANH);
    const o = (hang: number) => nguon[hang * CANH + 3];

    // Dưới chỗ mất: đứng nguyên.
    expect(o(6).tuHang).toBe(6);
    expect(o(5).tuHang).toBe(5);
    expect(o(4).tuHang).toBe(4);
    expect(o(3).tuHang).toBe(3);
    // Hai ô trên chỗ mất tụt một bậc.
    expect(o(2).tuHang).toBe(1);
    expect(o(1).tuHang).toBe(0);
    expect(o(0).tuHang).toBeNull();
  });

  it("mất cả một cột thì cả cột là ô mới", () => {
    const sauXoa = ban(
      "1234561",
      "2345612",
      "3456123",
      "4561234",
      "5612345",
      "6123456",
      "1234561",
    )
      .split("")
      .map((c, i) => (i % CANH === 0 ? O_RONG : c))
      .join("");

    const nguon = tinhDuongRoi(sauXoa, CANH);
    for (let hang = 0; hang < CANH; hang++) {
      expect(nguon[hang * CANH].tuHang).toBeNull();
    }
    // Các cột khác không bị ảnh hưởng.
    expect(nguon[3 * CANH + 2].tuHang).toBe(3);
  });

  it("không cột nào bị kéo ô sang cột khác", () => {
    // Trọng lực chạy TRONG từng cột. Một lỗi chỉ số kiểu nhầm hàng với cột
    // vẫn cho ra bàn đầy, nên chỉ đối chiếu từng cột mới thấy.
    const sauXoa = ban(
      "0000000",
      "2345612",
      "3456123",
      "4561234",
      "5612345",
      "6123456",
      "1234561",
    );
    const nguon = tinhDuongRoi(sauXoa, CANH);
    for (let cot = 0; cot < CANH; cot++) {
      expect(nguon[0 * CANH + cot].tuHang).toBeNull();
      for (let hang = 1; hang < CANH; hang++) {
        expect(nguon[hang * CANH + cot].tuHang).toBe(hang);
      }
    }
  });
});

describe("banSauRoi", () => {
  it("dồn ô xuống đáy và chừa chỗ trống ở trên", () => {
    const sauXoa = ban(
      "1234561",
      "2345612",
      "3456123",
      "4561234",
      "5012345",
      "6023456",
      "1034561",
    );
    const roi = banSauRoi(sauXoa, CANH);

    // Cột 1: bốn ô cũ (2,3,4,5 ở hàng 0..3) nằm ở hàng 3..6, ba hàng trên rỗng.
    const cot1 = Array.from({ length: CANH }, (_, h) => roi[h * CANH + 1]);
    expect(cot1).toEqual([O_RONG, O_RONG, O_RONG, "2", "3", "4", "5"]);

    // Cột khác giữ nguyên trật tự.
    const cot0 = Array.from({ length: CANH }, (_, h) => roi[h * CANH]);
    expect(cot0.join("")).toBe("1234561");
  });

  it("bàn đầy thì không đổi gì", () => {
    expect(banSauRoi(DAY, CANH)).toBe(DAY);
  });

  it("số ô không rỗng không đổi sau khi rơi", () => {
    const sauXoa = DAY.split("")
      .map((c, i) => (i % 5 === 0 ? O_RONG : c))
      .join("");
    const demTruoc = sauXoa.split("").filter((c) => c !== O_RONG).length;
    const demSau = banSauRoi(sauXoa, CANH)
      .split("")
      .filter((c) => c !== O_RONG).length;
    expect(demSau).toBe(demTruoc);
  });
});

describe("laKyTuO", () => {
  it("nhận đúng sáu ký tự, loại ô rỗng và ký tự lạ", () => {
    for (const c of ["1", "2", "3", "4", "5", "6"]) {
      expect(laKyTuO(c)).toBe(true);
    }
    expect(laKyTuO(O_RONG)).toBe(false);
    expect(laKyTuO("7")).toBe(false);
    expect(laKyTuO("x")).toBe(false);
  });
});

describe("phanTramNap", () => {
  it("quy ra phần trăm và chặn trong khoảng 0–100", () => {
    expect(phanTramNap(0, 80)).toBe(0);
    expect(phanTramNap(40, 80)).toBe(50);
    expect(phanTramNap(80, 80)).toBe(100);
    // Máy chủ đã chặn, nhưng nếu một ngày nó trả hơn thì thanh nạp không
    // được tràn ra khỏi khung và đè lên thứ bên cạnh.
    expect(phanTramNap(200, 80)).toBe(100);
    expect(phanTramNap(-5, 80)).toBe(0);
  });

  it("mốc cần bằng 0 thì coi như đã đầy, không chia cho 0", () => {
    expect(phanTramNap(0, 0)).toBe(100);
  });
});

describe("doiHaiO", () => {
  it("đổi đúng hai ô, không đụng ô nào khác", () => {
    const sau = doiHaiO(DAY, 0, 1);
    expect(sau[0]).toBe(DAY[1]);
    expect(sau[1]).toBe(DAY[0]);
    expect(sau.slice(2)).toBe(DAY.slice(2));
    expect(sau).toHaveLength(DAY.length);
  });

  it("đổi hai lần thì về như cũ", () => {
    expect(doiHaiO(doiHaiO(DAY, 10, 17), 10, 17)).toBe(DAY);
  });
});

describe("oTheoHuong", () => {
  const giua = chiSo(3, 3);

  it("lấy trục trội hơn", () => {
    expect(oTheoHuong(giua, 30, 5, CANH)).toBe(chiSo(3, 4));
    expect(oTheoHuong(giua, -30, 5, CANH)).toBe(chiSo(3, 2));
    expect(oTheoHuong(giua, 5, 30, CANH)).toBe(chiSo(4, 3));
    expect(oTheoHuong(giua, 5, -30, CANH)).toBe(chiSo(2, 3));
  });

  it("chưa kéo thì chưa có hướng nào", () => {
    expect(oTheoHuong(giua, 0, 0, CANH)).toBeNull();
  });

  /**
   * Đây đúng là lỗi đã mắc ở keNhau. Cộng trừ chỉ số trần thì kéo sang trái
   * từ cột 0 ra ô cuối hàng trên — hai ô nằm hai đầu bàn mà chỉ số cạnh nhau.
   */
  it("kéo ra ngoài mép thì không có ô đích, không vòng sang hàng khác", () => {
    expect(oTheoHuong(chiSo(3, 0), -30, 0, CANH)).toBeNull();
    expect(oTheoHuong(chiSo(3, CANH - 1), 30, 0, CANH)).toBeNull();
    expect(oTheoHuong(chiSo(0, 3), 0, -30, CANH)).toBeNull();
    expect(oTheoHuong(chiSo(CANH - 1, 3), 0, 30, CANH)).toBeNull();
  });

  it("ô đích luôn kề ô nguồn", () => {
    for (let i = 0; i < CANH * CANH; i++) {
      for (const [dx, dy] of [
        [30, 0],
        [-30, 0],
        [0, 30],
        [0, -30],
      ]) {
        const dich = oTheoHuong(i, dx, dy, CANH);
        if (dich !== null) {
          expect(keNhau(i, dich, CANH), `ô ${i} kéo (${dx},${dy})`).toBe(true);
        }
      }
    }
  });
});

describe("lechKhiKeo", () => {
  const CANH_O = 60;

  it("chỉ giữ trục trội hơn, không cho ô chạy chéo", () => {
    expect(lechKhiKeo(30, 10, CANH_O, true)).toEqual({ x: 30, y: 0 });
    expect(lechKhiKeo(10, 30, CANH_O, true)).toEqual({ x: 0, y: 30 });
  });

  it("không trượt quá một ô", () => {
    expect(lechKhiKeo(500, 0, CANH_O, true)).toEqual({ x: CANH_O, y: 0 });
    expect(lechKhiKeo(-500, 0, CANH_O, true)).toEqual({ x: -CANH_O, y: 0 });
  });

  /**
   * Kéo ra ngoài mép vẫn phải nhúc nhích: im hoàn toàn thì người chơi tưởng
   * màn hình treo. Nhưng không được chạy trọn một ô, vì thế là hứa một nước
   * đi mà thả tay ra sẽ không xảy ra.
   */
  it("kéo ra ngoài mép thì chỉ nhúc nhích, không trượt trọn một ô", () => {
    const l = lechKhiKeo(500, 0, CANH_O, false);
    expect(l.x).toBeGreaterThan(0);
    expect(l.x).toBeLessThan(CANH_O * TI_LE_CHOT);
  });

  it("ngưỡng chốt nhỏ hơn một ô, và ngưỡng rung nhỏ hơn ngưỡng chốt", () => {
    expect(TI_LE_CHOT).toBeGreaterThan(0);
    expect(TI_LE_CHOT).toBeLessThan(1);
    expect(NGUONG_RUNG).toBeLessThan(CANH_O * TI_LE_CHOT);
  });
});

describe("mucDoNo", () => {
  it("chuỗi ba là chuyện thường, không có tên riêng", () => {
    expect(mucDoNo(3)).toEqual({ bac: 0, ten: null });
    expect(mucDoNo(0)).toEqual({ bac: 0, ten: null });
  });

  it("càng nhiều ô càng lên bậc, và có tên", () => {
    expect(mucDoNo(4).bac).toBe(1);
    expect(mucDoNo(5).bac).toBe(1);
    expect(mucDoNo(6).bac).toBe(2);
    expect(mucDoNo(8).bac).toBe(2);
    expect(mucDoNo(9).bac).toBe(3);
    expect(mucDoNo(49).bac).toBe(3);
    for (const n of [4, 6, 9]) expect(mucDoNo(n).ten).toBeTruthy();
  });

  /**
   * Bậc không được tụt xuống khi số ô tăng lên. Viết ngưỡng theo thứ tự giảm
   * dần như hiện nay thì dễ, nhưng thêm một bậc vào giữa mà đặt sai chỗ là
   * nổ chín ô lại ra bậc thấp hơn nổ sáu ô — và không có gì báo.
   */
  it("bậc không bao giờ tụt khi số ô tăng", () => {
    let truoc = -1;
    for (let n = 0; n <= 49; n++) {
      const bac = mucDoNo(n).bac;
      expect(bac, `nổ ${n} ô`).toBeGreaterThanOrEqual(truoc);
      truoc = bac;
    }
  });

  it("mỗi bậc một tên khác nhau", () => {
    const ten = [4, 6, 9].map((n) => mucDoNo(n).ten);
    expect(new Set(ten).size).toBe(ten.length);
  });
});

describe("tamCacO", () => {
  it("không có ô nào thì không vẽ gì", () => {
    expect(tamCacO([], CANH)).toBeNull();
  });

  it("một ô thì tâm nằm giữa chính ô ấy", () => {
    const t = tamCacO([chiSo(0, 0)], CANH)!;
    // Ô đầu tiên chiếm 1/7 bàn, nên tâm nó ở 1/14 ≈ 7,14%.
    expect(t.x).toBeCloseTo((0.5 / CANH) * 100, 5);
    expect(t.y).toBeCloseTo((0.5 / CANH) * 100, 5);
  });

  it("chuỗi ba nằm ngang thì tâm ở giữa chuỗi, không phải giữa bàn", () => {
    const t = tamCacO([chiSo(1, 0), chiSo(1, 1), chiSo(1, 2)], CANH)!;
    expect(t.x).toBeCloseTo((1.5 / CANH) * 100, 5);
    expect(t.y).toBeCloseTo((1.5 / CANH) * 100, 5);
    expect(t.x).toBeLessThan(50);
  });

  it("tâm luôn nằm trong bàn", () => {
    for (const cac of [[0], [48], [0, 48], [0, 6, 42, 48]]) {
      const t = tamCacO(cac, CANH)!;
      expect(t.x).toBeGreaterThan(0);
      expect(t.x).toBeLessThan(100);
      expect(t.y).toBeGreaterThan(0);
      expect(t.y).toBeLessThan(100);
    }
  });
});

describe("nhipCuaBac", () => {
  const BAC = [0, 1, 2, 3] as const;

  it("bậc càng cao thì mỗi chặng càng lâu, không bậc nào ngắn hơn bậc dưới", () => {
    for (let i = 1; i < BAC.length; i++) {
      const tren = nhipCuaBac(BAC[i]);
      const duoi = nhipCuaBac(BAC[i - 1]);
      expect(tren.tan, `bậc ${i}`).toBeGreaterThan(duoi.tan);
      expect(tren.roi, `bậc ${i}`).toBeGreaterThanOrEqual(duoi.roi);
      expect(tren.lang, `bậc ${i}`).toBeGreaterThan(duoi.lang);
    }
  });

  /**
   * Chuỗi ba xảy ra mỗi lượt. Chen một khoảng lặng vào đó là bắt người chơi
   * ngồi xem suốt ván — đúng cái mà việc chia bậc sinh ra để tránh.
   */
  it("chuỗi ba thường không có khoảng lặng nào", () => {
    expect(nhipCuaBac(0).lang).toBe(0);
  });

  it("nổ lớn nhất vẫn gọn dưới một giây mỗi bậc", () => {
    for (const b of BAC) {
      const n = nhipCuaBac(b);
      expect(n.tan + n.roi + n.lang, `bậc ${b}`).toBeLessThan(1100);
    }
  });

  it("nhịp giảm chuyển động ngắn hơn mọi bậc thường", () => {
    for (const b of BAC) {
      const n = nhipCuaBac(b);
      expect(NHIP_GIAM.tan).toBeLessThanOrEqual(n.tan);
      expect(NHIP_GIAM.roi).toBeLessThanOrEqual(n.roi);
    }
    // Nhưng vẫn phải có khoảng lặng: bỏ hẳn thì các bậc dính vào nhau thành
    // một cú đổi bàn, và người chơi mất luôn thông tin mình vừa ăn mấy chuỗi.
    expect(NHIP_GIAM.lang).toBeGreaterThan(0);
  });

  it("bảng thành tích giữ đủ lâu để đọc", () => {
    expect(MS_GIU_BANG).toBeGreaterThanOrEqual(2000);
  });
});

describe("tamTrongBan", () => {
  it("điểm ở giữa bàn thì không bị động tới", () => {
    expect(tamTrongBan({ x: 50, y: 50 }, 20)).toEqual({ x: 50, y: 50 });
  });

  it("kéo điểm sát mép vào trong", () => {
    // Chuỗi ba dọc ở cột ngoài cùng cho tâm x ≈ 7%. Vẽ khung chữ ở đúng đó
    // thì nửa khung nằm ngoài bàn.
    expect(tamTrongBan({ x: 7, y: 50 }, 20)).toEqual({ x: 20, y: 50 });
    expect(tamTrongBan({ x: 96, y: 50 }, 20)).toEqual({ x: 80, y: 50 });
    expect(tamTrongBan({ x: 50, y: 2 }, 20)).toEqual({ x: 50, y: 20 });
  });

  it("không bao giờ kéo quá về giữa bàn", () => {
    // Đây mới là điều kiện quan trọng: kéo hẳn về giữa là mất thứ quý nhất —
    // phần thưởng phải hiện ra ở ĐÚNG chỗ người chơi vừa xếp.
    for (let x = 0; x <= 100; x += 5) {
      const r = tamTrongBan({ x, y: x }, 20);
      // Đã dịch thì phải dịch về phía giữa, và không vượt qua mép an toàn.
      expect(Math.abs(r.x - 50)).toBeLessThanOrEqual(Math.abs(x - 50));
      expect(r.x).toBeGreaterThanOrEqual(20);
      expect(r.x).toBeLessThanOrEqual(80);
    }
  });

  it("tâm thật của một đám ô luôn nằm trong bàn sau khi kẹp", () => {
    // Ghép với tamCacO: mọi vị trí ô trên bàn 7×7 đều phải ra điểm vẽ được.
    const canh = 7;
    for (let i = 0; i < canh * canh; i++) {
      const t = tamCacO([i], canh);
      expect(t).not.toBeNull();
      const r = tamTrongBan(t!, 26);
      expect(r.x).toBeGreaterThanOrEqual(26);
      expect(r.x).toBeLessThanOrEqual(74);
      expect(r.y).toBeGreaterThanOrEqual(26);
      expect(r.y).toBeLessThanOrEqual(74);
    }
  });
});
