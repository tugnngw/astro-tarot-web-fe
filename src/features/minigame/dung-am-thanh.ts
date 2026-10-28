import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AM_MAC_DINH,
  BoAm,
  docCaiDat,
  kepMuc,
  luuCaiDat,
  type CaiDatAm,
} from "./am-thanh";

/**
 * Giữ bộ phát tiếng và cài đặt của nó.
 *
 * ## Vì sao cài đặt khởi tạo bằng giá trị mặc định rồi mới đọc ổ đĩa
 *
 * Trang này dựng sẵn ở máy chủ (SSR). Đọc `localStorage` ngay trong lần dựng
 * đầu thì máy chủ không có nó và sẽ ném lỗi, còn nếu bọc lỗi lại thì máy chủ
 * ra "mặc định" mà máy khách ra "đã lưu" — hai bản HTML khác nhau, React báo
 * lệch hydrat hoá rồi vứt cả cây đi dựng lại.
 *
 * Nên lần dựng đầu luôn là mặc định ở cả hai phía, và cái đã lưu được nạp
 * trong `useEffect` — chỗ chỉ chạy ở máy khách.
 */
export function useAmThanh() {
  const [caiDat, datCaiDat] = useState<CaiDatAm>(AM_MAC_DINH);
  const am = useMemo(() => new BoAm(AM_MAC_DINH), []);

  // Chạy một lần sau khi gắn: nạp cài đặt đã lưu của người chơi.
  useEffect(() => {
    const c = docCaiDat();
    datCaiDat(c);
    am.datCaiDat(c);
  }, [am]);

  const doi = useCallback(
    (moi: CaiDatAm) => {
      datCaiDat(moi);
      am.datCaiDat(moi);
      luuCaiDat(moi);
      // Mở máy ngay trong cú bấm: trình duyệt chỉ cho dựng AudioContext từ
      // một hành động của người dùng, và đây là hành động chắc chắn có.
      am.danhThuc();
    },
    [am],
  );

  const datBat = useCallback(
    (bat: boolean) => doi({ ...caiDat, bat }),
    [caiDat, doi],
  );
  // Kéo thanh âm lượng thì bật tiếng luôn: không ai kéo nó khi đang muốn im.
  const datMuc = useCallback(
    (muc: number) => doi({ bat: true, muc: kepMuc(muc) }),
    [doi],
  );

  return { am, caiDat, datBat, datMuc };
}
