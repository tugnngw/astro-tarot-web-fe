// Điều khiển phân trang dùng chung cho mọi bảng.
//
// Trước đây các bảng nạp thẳng 50–100 dòng rồi đổ hết ra một lượt: trang dài
// vô tận, và bảng nào nhiều dữ liệu thì tải chậm dù người xem chỉ nhìn mươi
// dòng đầu.
//
// Hai điều kiện để sang trang không bị "nhảy":
//   1. Dùng `keepPreviousData` ở tầng query, để lúc chờ trang mới vẫn giữ
//      trang cũ trên màn hình thay vì rơi về khung xương rỗng.
//   2. Bọc phần danh sách trong <PagedList> để mọi trang cao bằng nhau —
//      trang cuối ít dòng hơn vẫn chiếm đúng chỗ, nên nút bấm không chạy lên.
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/** Số dòng mỗi trang, dùng chung để mọi bảng trông giống nhau. */
export const PAGE_SIZE = 10;

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
  busy = false,
  unit = "mục",
  pageSize = PAGE_SIZE,
}: {
  /** Trang hiện tại, đếm từ 0 như BE. */
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
  /** Đang tải trang mới — khoá nút để không bấm dồn. */
  busy?: boolean;
  /** Danh từ đếm, ví dụ "giao dịch", "lịch hẹn". */
  unit?: string;
  /** Lưới thẻ cần nhiều mục hơn bảng dòng, nên cho phép khai khác mặc định. */
  pageSize?: number;
}) {
  // Một trang thì không có gì để đi tới — nhưng vẫn hiện tổng số, vì đó là
  // thông tin người dùng cần dù có phân trang hay không.
  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);

  return (
    /* KHÔNG flex-wrap.
       Với flex-wrap, độ dài của chính cái nhãn quyết định thanh này cao một
       dòng hay hai: "1–10 trên 20 tài khoản" đẩy cặp nút xuống dòng dưới, còn
       "2 tài khoản" thì không — nên lọc lại một cái là cả khối tụt 44px. Đo
       được trên production ở khung hẹp.

       Một dòng cố định, nhãn tự cắt bớt khi chật. Thà mất vài chữ còn hơn để
       cả trang nhảy. */
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        {totalElements === 0
          ? `Không có ${unit} nào`
          : `${from}–${to} trên ${totalElements} ${unit}`}
      </p>

      {/* Luôn chiếm chỗ, kể cả khi chỉ có một trang.
          Ẩn hẳn cặp nút thì khối này cao lên hụt xuống 44px mỗi lần bộ lọc
          đưa danh sách về một trang — vẫn là nhảy, chỉ nhỏ hơn. `invisible`
          giữ nguyên chỗ; `aria-hidden` để trình đọc màn hình không đọc hai
          cái nút vô nghĩa. */}
      <div
        className={`flex shrink-0 items-center gap-1 ${totalPages > 1 ? "" : "invisible"}`}
        aria-hidden={totalPages <= 1}
      >
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page === 0 || busy}
          onClick={() => onChange(page - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-gold/50 hover:text-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {busy && <Loader2 className="h-3 w-3 animate-spin text-gold" />}
          Trang {page + 1}/{totalPages}
        </span>

        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages - 1 || busy}
          onClick={() => onChange(page + 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-gold/50 hover:text-gold disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Giữ cho vùng danh sách luôn chiếm đúng chỗ của MỘT TRANG ĐẦY.
 *
 * Vấn đề: trang cuối thường ít dòng hơn, nên cả khối tụt lên và nút "Trang
 * sau" chạy khỏi chỗ ngón tay vừa bấm. Lọc lại còn hai kết quả cũng vậy.
 *
 * Cách làm: đo chiều cao lúc trên màn hình đang có ĐỦ một trang, nhớ lấy, rồi
 * đặt làm min-height cho mọi trang sau đó. Không đoán "số dòng × chiều cao ước
 * lượng" — mỗi bảng có dòng cao khác nhau, bảng đối soát đo được ~600px một
 * dòng, gấp tám lần con số tôi từng đoán.
 *
 * Vì sao đo "một trang đầy" chứ không phải "mức cao nhất từng thấy" như bản
 * trước: bản trước chỉ chặn được việc TỤT XUỐNG sau khi đã từng cao. Vào thẳng
 * một trang ít dòng thì nó vẫn ngắn, rồi cao lên khi sang trang khác — vẫn là
 * nhảy, chỉ nhảy theo chiều ngược lại.
 *
 * Danh sách chưa bao giờ đủ một trang (5 Reader trên tổng 5) thì giữ nguyên
 * chiều cao thật của nó. Chừa sẵn chỗ cho mười dòng ở một danh sách chỉ có năm
 * là để lại một mảng trống vô cớ — mà nó cũng không hề nhảy, vì số dòng không
 * bao giờ đổi.
 *
 * Cách đếm dòng phải chịu được ba kiểu bố cục đang dùng trong dự án: bảng
 * (<tbody><tr>), danh sách (<ul><li>), và lưới thẻ (<div class="grid">).
 */
export function PagedList({
  children,
  pageSize = PAGE_SIZE,
  listRef,
}: {
  children: ReactNode;
  /** Số mục của một trang đầy. Lưới thẻ đếm khác bảng dòng. */
  pageSize?: number;
  /**
   * Cho useCoTrangVuaManHinh mượn để đo. Cùng trỏ vào phần tử bọc nội dung,
   * nên hook đo được cả vị trí bắt đầu lẫn chiều cao một dòng.
   */
  listRef?: RefObject<HTMLDivElement | null>;
}) {
  const rieng = useRef<HTMLDivElement>(null);
  const inner = listRef ?? rieng;
  const [minHeight, setMinHeight] = useState(0);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;

    // Chỉ ghi nhớ khi đang hiển thị đủ một trang. Trang thiếu dòng thì chiều
    // cao của nó không nói lên điều gì về chỗ cần chừa.
    if (demDong(el) < pageSize) return;

    const h = el.getBoundingClientRect().height;
    // Ngưỡng 1px để tránh nhấp nháy vì số lẻ khi trình duyệt làm tròn.
    if (h > minHeight + 1) setMinHeight(h);
  });

  return (
    <div style={minHeight ? { minHeight } : undefined}>
      <div ref={inner}>{children}</div>
    </div>
  );
}

/**
 * Đếm số mục đang hiển thị, bất kể bố cục.
 *
 * Bảng thì dòng nằm trong tbody; danh sách và lưới thì mục là con trực tiếp
 * của phần tử bọc đầu tiên.
 */
function demDong(el: HTMLElement): number {
  const tbody = el.querySelector("tbody");
  if (tbody) return tbody.children.length;
  return el.firstElementChild?.children.length ?? 0;
}

/**
 * Chọn số dòng mỗi trang sao cho một trang vừa đúng một màn hình.
 *
 * <p>Mục đích: không phải cuộn xuống mới thấy nút sang trang. Một con số cố
 * định không làm được việc đó — đo thật trên màn 1440×900 thì bảng nhân sự bắt
 * đầu ở 372px và mỗi dòng cao 61px, nên vừa 7 dòng; cũng bảng ấy trên laptop
 * 768px chiều cao thì chỉ vừa 4. Chênh nhau gần gấp đôi.
 *
 * <p>Nên tính từ chỗ trống thật: lấy chiều cao màn hình, trừ đi phần nằm trên
 * danh sách (tiêu đề, tab, bộ lọc) và phần nằm dưới (thanh phân trang), rồi
 * chia cho chiều cao một dòng.
 *
 * <p>Chiều cao dòng ĐO từ dòng đang hiển thị chứ không nhận từ tham số: mỗi
 * bảng một khác, và đoán thì sai — bảng đối soát có dòng cao gấp tám lần bảng
 * tài khoản.
 *
 * <p>`buoc` để lưới thẻ luôn lấy trọn hàng: lưới bốn cột mà trả về 7 thì hàng
 * cuối lẻ ba thẻ, nhìn như bị cắt. Truyền số cột vào đây thì kết quả luôn là
 * bội của nó.
 *
 * @param ref  phần tử bọc danh sách, để biết nó bắt đầu ở đâu trên màn hình
 */
export function useCoTrangVuaManHinh(
  ref: RefObject<HTMLElement | null>,
  {
    toiThieu = 3,
    toiDa = 20,
    buoc = 1,
    duTru = 96,
  }: { toiThieu?: number; toiDa?: number; buoc?: number; duTru?: number } = {},
) {
  const [coTrang, setCoTrang] = useState(PAGE_SIZE);
  const [nhip, setNhip] = useState(0);

  // Đo lại sau MỖI lần vẽ, không phải một lần lúc mount.
  //
  // Bản đầu chỉ chạy khi mount và trả về đúng giá trị mặc định: lúc đó danh
  // sách còn đang tải, chưa có dòng nào để đo chiều cao, nên hàm thoát sớm và
  // không bao giờ chạy lại. Đo được trên production: màn 900px mà vẫn cắt 10
  // dòng thay vì 7.
  //
  // Chạy mỗi lần vẽ không gây vòng lặp vì chỉ gọi setCoTrang khi con số thật
  // sự đổi — giống cách PagedList đo chiều cao.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const dong = layMotDong(el);
    if (!dong) return;
    const caoDong = dong.getBoundingClientRect().height;
    if (caoDong < 8) return;

    const conLai = window.innerHeight - el.getBoundingClientRect().top - duTru;

    let n = Math.floor(conLai / caoDong);
    n = Math.floor(n / buoc) * buoc;
    n = Math.min(toiDa, Math.max(toiThieu, n));

    setCoTrang((truoc) => (truoc === n ? truoc : n));
  });

  // Đổi kích thước cửa sổ thì thúc một nhịp để đo lại, nhưng chờ người dùng
  // thả chuột đã — mỗi lần đổi cỡ trang là một lượt gọi lại API.
  useLayoutEffect(() => {
    let hen: ReturnType<typeof setTimeout>;
    const khiDoiCo = () => {
      clearTimeout(hen);
      hen = setTimeout(() => setNhip((n) => n + 1), 250);
    };
    window.addEventListener("resize", khiDoiCo);
    return () => {
      clearTimeout(hen);
      window.removeEventListener("resize", khiDoiCo);
    };
  }, []);

  void nhip;
  return coTrang;
}

/** Một mục bất kỳ đang hiển thị, để đo chiều cao. Xem demDong. */
function layMotDong(el: HTMLElement): Element | null {
  const tbody = el.querySelector("tbody");
  if (tbody) return tbody.firstElementChild;
  return el.firstElementChild?.firstElementChild ?? null;
}
