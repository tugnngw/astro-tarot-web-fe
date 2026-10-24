import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { getDangOnline, type DongSo } from "@/api/analytics";
import { getHanhTrinhTheoNguon } from "@/api/marketing";
import { ChuThich } from "@/components/ChuThich";

const nf = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

/** Làm mới mỗi 30 giây — đủ để thấy người vào ra mà không dội API. */
const NHIP_LAM_MOI = 30_000;

/**
 * Ai đang ở trên web NGAY BÂY GIỜ, ở đâu, đang xem gì.
 *
 * ## Vì sao cột "đến từ đâu" lấy từ nơi khác
 *
 * Realtime API của GA4 chỉ nhận một tập chiều rất hẹp — thành phố, trang,
 * thiết bị, tên sự kiện — và **không có** nguồn phiên. Google biết đang có 3
 * người ở TP.HCM xem trang Tarot, nhưng không nói được họ đến từ Facebook hay
 * tự gõ địa chỉ.
 *
 * Nên bảng nguồn ở đây đọc từ `marketing_events` của chính hệ thống. Đó cũng
 * là lý do bảng ấy đáng tồn tại song song với GA4 chứ không phải làm trùng
 * việc.
 *
 * ## Vì sao hai nguồn số liệu không khớp nhau, và đó là bình thường
 *
 * GA4 đếm **người đang mở trang trong 30 phút qua**, kể cả khách chưa đăng
 * nhập, nhưng bị trình chặn quảng cáo cắt mất một phần. Bảng của mình đếm
 * **lượt bấm vào các nút đã gắn theo dõi trong 30 ngày**, không bị chặn, và
 * nối được với tài khoản. Hai thứ trả lời hai câu hỏi khác nhau.
 */
export function DangOnlineNgayBayGio() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["ga4", "dang-online"],
    queryFn: getDangOnline,
    refetchInterval: NHIP_LAM_MOI,
    // Hỏi lại ngay khi người quản trị quay lại tab — con số "đang online" mà
    // đứng im từ lúc họ chuyển sang cửa sổ khác thì vô nghĩa.
    refetchOnWindowFocus: true,
  });

  const { data: nguon } = useQuery({
    queryKey: ["marketing", "theo-nguon"],
    queryFn: getHanhTrinhTheoNguon,
  });

  const so = data?.soNguoiDangOnline ?? -1;
  const khongHoiDuoc = so < 0;

  return (
    <section className="glass rounded-2xl border border-emerald-500/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio
            className={
              so > 0
                ? "h-4 w-4 animate-pulse text-emerald-400"
                : "h-4 w-4 text-muted-foreground"
            }
          />
          <h2 className="font-display text-lg">Đang online ngay bây giờ</h2>
        </div>
        {dataUpdatedAt > 0 && !khongHoiDuoc && (
          <span className="text-xs text-muted-foreground">
            Cập nhật {new Date(dataUpdatedAt).toLocaleTimeString("vi-VN")}
          </span>
        )}
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Đang hỏi Google…</p>
      )}

      {(isError || khongHoiDuoc) && !isLoading && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/90">
          {data?.thongDiep ??
            "Không đọc được số liệu thời gian thực. Kiểm hai biến GA4 trên Render."}
        </p>
      )}

      {!isLoading && !khongHoiDuoc && (
        <>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-4xl leading-none text-emerald-400">
              {nf(so)}
            </span>
            <span className="text-sm text-muted-foreground">
              người trong 30 phút qua
            </span>
          </div>

          {so === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Chưa có ai đang mở web.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Bang tieuDe="Đang ở đâu" rong={data?.theoNoi} donVi="người" />
            <Bang tieuDe="Đang xem trang" rong={data?.theoTrang} donVi="người" />
            <Bang
              tieuDe="Vừa làm gì"
              rong={data?.theoHanhDong}
              donVi="lượt"
            />
            <Bang
              tieuDe="Dùng thiết bị gì"
              rong={data?.theoThietBi}
              donVi="người"
            />
          </div>
        </>
      )}

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium">Đến từ đâu</h3>
          <span className="text-xs text-muted-foreground/60">30 ngày</span>
          <ChuThich>
            Google không trả nguồn truy cập ở chế độ thời gian thực, nên phần
            này đọc từ cơ sở dữ liệu của hệ thống. Con số sẽ không khớp với ô
            bên trên: Google đếm người đang mở trang trong 30 phút, còn đây
            đếm lượt bấm nút trong 30 ngày.
          </ChuThich>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(nguon ?? []).slice(0, 8).map((n) => (
            <span
              key={n.nguon}
              className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs"
            >
              {n.nguon}{" "}
              <strong className="text-gold">{nf(n.tongLuot)}</strong> lượt
              {n.soNguoiDangNhap > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  · {nf(n.soNguoiDangNhap)} người
                </span>
              )}
            </span>
          ))}
          {(nguon ?? []).length === 0 && (
            <span className="text-xs text-muted-foreground">
              Chưa có lượt nào được ghi.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Bang({
  tieuDe,
  rong,
  donVi,
}: {
  tieuDe: string;
  rong: DongSo[] | undefined;
  donVi: string;
}) {
  const ds = rong ?? [];
  return (
    <div className="rounded-xl bg-mystic/10 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {tieuDe}
      </div>
      {ds.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground/70">Chưa có.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {ds.map((d) => (
            <li key={d.ten} className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm" title={d.ten}>
                {d.ten}
              </span>
              <span className="shrink-0 text-sm text-gold">
                {nf(d.so)}{" "}
                <span className="text-3xs text-muted-foreground">
                  {donVi}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
