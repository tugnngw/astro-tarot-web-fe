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
