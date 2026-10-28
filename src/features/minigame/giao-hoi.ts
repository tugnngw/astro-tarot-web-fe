// ============================================================
// GIAO HỘI — phần tính toán thuần của giao diện
//
// Luật của game nằm hết ở máy chủ (xem src/api/game.ts). Tệp này chỉ lo
// phần hình: ô nào vừa rơi từ đâu xuống, ô nào mới trượt vào từ trên.
// ============================================================

/** Ký tự đánh dấu ô đã biến mất, trùng với LoaiO.RONG ở BE. */
export const O_RONG = "0";

/** Sáu biểu tượng, khớp enum LoaiO ở BE theo đúng ký tự. */
export const LOAI_O = {
  "1": { ma: "GAY", ten: "Gậy" },
  "2": { ma: "COC", ten: "Cốc" },
  "3": { ma: "GUOM", ten: "Gươm" },
  "4": { ma: "TIEN", ten: "Tiền" },
  "5": { ma: "SAO", ten: "Sao" },
  "6": { ma: "TRANG", ten: "Trăng" },
} as const;

export type KyTuO = keyof typeof LOAI_O;

export function laKyTuO(c: string): c is KyTuO {
  return c in LOAI_O;
}

/** Tên loại ô, để đọc cho trình đọc màn hình và hiện trong bảng chú giải. */
export function tenLoai(loai: KyTuO): string {
  return LOAI_O[loai].ten;
}

/** Hai ô có kề nhau theo cạnh không. Chéo không tính — BE cũng vậy. */
export function keNhau(a: number, b: number, canh: number): boolean {
  const ha = Math.floor(a / canh);
  const ca = a % canh;
  const hb = Math.floor(b / canh);
  const cb = b % canh;
  return Math.abs(ha - hb) + Math.abs(ca - cb) === 1;
}

/**
 * Ô ở đích này đến từ đâu.
 *
 * `tuHang` là hàng cũ của nó trên cùng cột; `null` nghĩa là ô mới rót vào
 * từ trên mép bàn.
 */
export type NguonO = { tuHang: number | null };

/**
 * Với mỗi ô của bàn SAU khi rơi, nó vốn ở hàng nào.
 *
 * ## Vì sao cần hàm này
 *
 * Máy chủ trả hai ảnh bàn cho mỗi bậc dây chuyền: lúc vừa xoá (còn ô rỗng)
 * và lúc đã rót ô mới. Chỉ có hai ảnh ấy thì hoạt ảnh duy nhất làm được là
 * mờ đi rồi hiện ra — cả bàn nhấp một cái, người chơi không thấy ô nào rơi
 * xuống đâu, và không hiểu vừa ăn chuỗi nào.
 *
 * Trọng lực thì tất định, nên chỗ cũ của từng ô tính lại được ngay ở đây —
 * không cần máy chủ gửi thêm gì. Có nó rồi thì mỗi ô biết phải trượt xuống
 * bao nhiêu bậc, và ô mới biết mình vào từ ngoài mép.
 *
 * Thuật toán phải khớp từng bước với `Bang.roi()` ở BE: quét từ ĐÁY lên,
 * mỗi ô không rỗng hạ xuống vị trí trống thấp nhất còn lại.
 */
export function tinhDuongRoi(bangSauXoa: string, canh: number): NguonO[] {
  const nguon: NguonO[] = Array.from({ length: canh * canh }, () => ({
    tuHang: null,
  }));

  for (let cot = 0; cot < canh; cot++) {
    let viTri = canh - 1;
    for (let hang = canh - 1; hang >= 0; hang--) {
      if (bangSauXoa[hang * canh + cot] !== O_RONG) {
        nguon[viTri * canh + cot] = { tuHang: hang };
        viTri--;
      }
    }
    // Những hàng còn lại phía trên nhận ô mới.
    for (let hang = viTri; hang >= 0; hang--) {
      nguon[hang * canh + cot] = { tuHang: null };
    }
  }
  return nguon;
}

/**
 * Bàn sau khi rơi nhưng CHƯA rót ô mới.
 *
 * Dùng cho nhịp giữa của hoạt ảnh: ô cũ đã về chỗ mới, chỗ trống trên đỉnh
 * còn để không, rồi ô mới mới trượt vào. Gộp hai nhịp ấy lại thì ô mới xuất
 * hiện cùng lúc với ô cũ đang rơi, và mắt không theo được cái nào là cái nào.
 */
export function banSauRoi(bangSauXoa: string, canh: number): string {
  const o = Array.from({ length: canh * canh }, () => O_RONG);
  for (let cot = 0; cot < canh; cot++) {
    let viTri = canh - 1;
    for (let hang = canh - 1; hang >= 0; hang--) {
      const c = bangSauXoa[hang * canh + cot];
      if (c !== O_RONG) {
        o[viTri * canh + cot] = c;
        viTri--;
      }
    }
  }
  return o.join("");
}

/**
 * Phần trăm đã nạp của thanh kĩ năng, chặn trong [0, 100].
 *
 * Chặn trần ở đây chứ không ở chỗ vẽ: máy chủ đã chặn năng lượng không vượt
 * mốc cần, nhưng nếu một ngày nó trả hơn thì thanh nạp tràn ra ngoài khung
 * và đè lên những thứ bên cạnh.
 */
export function phanTramNap(nangLuong: number, can: number): number {
  if (can <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((nangLuong / can) * 100)));
}

// ============================================================
// KÉO THẢ
// ============================================================

/** Đổi chỗ hai ký tự trên bàn. Thuần hình ảnh — máy chủ mới là nơi xét luật. */
export function doiHaiO(bang: string, a: number, b: number): string {
  const o = bang.split("");
  [o[a], o[b]] = [o[b], o[a]];
  return o.join("");
}

/**
 * Ô mà cú kéo đang nhắm tới, theo trục trội hơn.
 *
 * Trả `null` khi chưa kéo đủ xa để biết hướng, hoặc khi hướng ấy chạy ra
 * ngoài mép bàn.
 *
 * ## Vì sao không chỉ cộng trừ chỉ số
 *
 * Kéo sang trái từ cột 0 mà làm `tuO - 1` thì ra ô CUỐI hàng trên — hai ô
 * nằm hai đầu bàn, nhưng chỉ số thì cạnh nhau. Máy chủ sẽ từ chối, nên không
 * ai mất điểm; chỉ là người chơi thấy một ô tận mép kia nhúc nhích theo tay
 * mình và không hiểu vì sao. Đây đúng là lỗi đã mắc ở `keNhau`.
 */
export function oTheoHuong(
  tuO: number,
  dx: number,
  dy: number,
  canh: number,
): number | null {
  const hang = Math.floor(tuO / canh);
  const cot = tuO % canh;

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx === 0) return null;
    const cotMoi = cot + (dx > 0 ? 1 : -1);
    return cotMoi < 0 || cotMoi >= canh ? null : hang * canh + cotMoi;
  }
  const hangMoi = hang + (dy > 0 ? 1 : -1);
  return hangMoi < 0 || hangMoi >= canh ? null : hangMoi * canh + cot;
}

/** Ngưỡng nhúc nhích bị bỏ qua, tính bằng pixel — tay ai cũng rung một chút. */
export const NGUONG_RUNG = 4;

/** Kéo quá bấy nhiêu phần một ô thì thả ra là ăn nước đi. */
export const TI_LE_CHOT = 0.35;

/**
 * Độ lệch thật sự vẽ ra, từ quãng tay đã kéo.
 *
 * Chỉ giữ trục trội hơn: cho ô chạy chéo theo tay thì nó rời khỏi lưới và
 * không còn ăn khớp với nước đi sắp gửi đi.
 *
 * Kéo ra ngoài mép bàn ({@code coDich} false) thì vẫn nhúc nhích một quãng
 * ngắn rồi khựng lại — im hoàn toàn thì người chơi tưởng màn hình treo, còn
 * cho nó chạy trọn một ô thì lại hứa một nước đi không có thật.
 */
export function lechKhiKeo(
  dx: number,
  dy: number,
  canhO: number,
  coDich: boolean,
): { x: number; y: number } {
  const tran = coDich ? canhO : canhO * 0.25;
  const kep = (v: number) => Math.max(-tran, Math.min(tran, v));
  return Math.abs(dx) >= Math.abs(dy)
    ? { x: kep(dx), y: 0 }
    : { x: 0, y: kep(dy) };
}

// ============================================================
// MỨC ĐỘ CỦA MỘT CÚ NỔ
// ============================================================

/**
 * Nổ ba ô và nổ chín ô là hai chuyện khác hẳn nhau về công sức, nên chúng
 * phải khác nhau trên màn hình.
 *
 * Tên gọi lấy từ thuật ngữ chiêm tinh cho những lần các thiên thể xếp thẳng
 * hàng — cùng mạch với cái tên "Giao Hội" của chính trò chơi, và đúng thứ
 * người chơi vừa làm: xếp cho chúng thẳng hàng.
 */
export type MucDoNo = {
  /** 0 là chuỗi ba thường, 3 là lớn nhất. */
  bac: 0 | 1 | 2 | 3;
  /** Tên hiện lên giữa bàn; null ở bậc 0 vì chuỗi ba là chuyện thường. */
  ten: string | null;
};

const BAC_NO: ReadonlyArray<{ tuSoO: number; bac: 1 | 2 | 3; ten: string }> = [
  { tuSoO: 9, bac: 3, ten: "Tinh Hà" },
  { tuSoO: 6, bac: 2, ten: "Thiên Triệu" },
  { tuSoO: 4, bac: 1, ten: "Tam Hợp" },
];

export function mucDoNo(soO: number): MucDoNo {
  for (const m of BAC_NO) {
    if (soO >= m.tuSoO) return { bac: m.bac, ten: m.ten };
  }
  return { bac: 0, ten: null };
}

/**
 * Tâm của đám ô vừa nổ, tính theo phần trăm bề ngang và bề cao của bàn.
 *
 * Dùng để đặt vòng sáng lan ra. Đặt cố định giữa bàn thì một chuỗi ba ở góc
 * cũng loé sáng ở chính giữa — mắt nhìn vào giữa trong khi chuyện xảy ra ở
 * góc, nên hiệu ứng vừa không giúp gì vừa kéo mắt đi sai chỗ.
 *
 * Trả `null` khi không có ô nào, để bên gọi khỏi vẽ gì.
 */
export function tamCacO(
  cacO: readonly number[],
  canh: number,
): { x: number; y: number } | null {
  if (cacO.length === 0) return null;
  let tongHang = 0;
  let tongCot = 0;
  for (const i of cacO) {
    tongHang += Math.floor(i / canh);
    tongCot += i % canh;
  }
  // Cộng nửa ô để ra TÂM ô chứ không phải mép trên bên trái của nó.
  return {
    x: ((tongCot / cacO.length + 0.5) / canh) * 100,
    y: ((tongHang / cacO.length + 0.5) / canh) * 100,
  };
}

/**
 * Kéo một điểm vào trong bàn để thứ vẽ ở đó không tràn ra ngoài mép.
 *
 * Tâm đám ô vừa nổ có thể nằm sát mép — một chuỗi ba dọc ở cột ngoài cùng cho
 * ra x ≈ 7%. Vẽ một khung chữ ở đúng đó thì nửa khung nằm ngoài bàn: chữ bị
 * cắt, hoặc nó phủ lên bảng thành tích bên cạnh.
 *
 * Nên con số được kéo vào trong, nhưng CHỈ vừa đủ. Kéo hẳn về giữa bàn thì
 * mất luôn thứ quý nhất: người chơi đang nhìn vào chỗ mình vừa xếp, và phần
 * thưởng phải hiện ra ở ĐÚNG chỗ ấy. Bắt mắt chạy sang chỗ khác đọc là cắt
 * đứt mối liên hệ giữa việc mình vừa làm và cái mình vừa được.
 */
export function tamTrongBan(
  tam: { x: number; y: number },
  bien: number,
): { x: number; y: number } {
  const kep = (v: number) => Math.min(100 - bien, Math.max(bien, v));
  return { x: kep(tam.x), y: kep(tam.y) };
}

// ============================================================
// NHỊP
// ============================================================

/** Thời lượng từng chặng của một bậc dây chuyền, tính bằng mili giây. */
export type Nhip = {
  /** Ô sáng lên rồi tan. */
  tan: number;
  /** Ô còn lại rơi xuống, ô mới trượt vào. */
  roi: number;
  /** Khoảng lặng sau đó, trước khi sang bậc tiếp theo. */
  lang: number;
};

/**
 * Nổ càng lớn thì càng được để lâu trên màn hình.
 *
 * ## Vì sao không để một nhịp chung cho mọi cú nổ
 *
 * Một nhịp chung thì phải chọn: nhanh đều, hoặc chậm đều. Nhanh đều thì cú
 * nổ chín ô — thứ người chơi phải dành cả chục lượt mới nạp đủ kĩ năng để
 * làm — loé lên rồi biến mất trước khi mắt kịp bắt, nên công sức ấy không
 * được trả lại gì. Chậm đều thì chuỗi ba, thứ xảy ra mỗi lượt, biến cả ván
 * thành ngồi xem.
 *
 * Nên nhịp đi theo bậc: chuỗi ba thường thì gọn và không có khoảng lặng nào,
 * còn nổ lớn thì ô tan lâu hơn, và sau khi rơi xong còn một khoảng lặng để
 * người chơi nhìn thấy mình vừa làm được gì trước khi bàn chạy tiếp.
 *
 * Khoảng lặng mới là thứ quan trọng, không phải thời lượng hoạt ảnh: kéo dài
 * hoạt ảnh chỉ làm mọi thứ chậm chạp, còn một nhịp đứng im sau cú nổ thì tách
 * nó ra khỏi dòng chảy và biến nó thành một sự kiện.
 */
export function nhipCuaBac(bac: 0 | 1 | 2 | 3): Nhip {
  switch (bac) {
    case 0:
      return { tan: 150, roi: 170, lang: 0 };
    case 1:
      return { tan: 200, roi: 190, lang: 140 };
    case 2:
      return { tan: 260, roi: 210, lang: 300 };
    case 3:
      return { tan: 320, roi: 230, lang: 480 };
  }
}

/** Nhịp khi người dùng bật "giảm chuyển động": vẫn tách bậc, nhưng gọn hẳn. */
export const NHIP_GIAM: Nhip = { tan: 90, roi: 90, lang: 60 };

/** Bảng thành tích bên cạnh bàn giữ lại cú nổ cuối bấy nhiêu lâu rồi mới mờ đi. */
export const MS_GIU_BANG = 3200;
