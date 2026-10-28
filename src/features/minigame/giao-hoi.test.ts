import { describe, expect, it } from "vitest";

import {
  banSauRoi,
  keNhau,
  laKyTuO,
  O_RONG,
  phanTramNap,
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
