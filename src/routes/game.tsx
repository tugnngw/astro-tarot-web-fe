// Mini game "Giao Hội" — xếp ba biểu tượng, điểm đổi ra lượt Tarot AI.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";

import {
  batDauPhien,
  layTrangThai,
  type MaNhanVat,
  type Phien,
  type Thuong,
  type TrangThaiGame,
} from "@/api/game";
import { Header } from "@/components/Header";
import { BanGiaoHoi } from "@/features/minigame/BanGiaoHoi";
import { ChonNhanVat } from "@/features/minigame/ChonNhanVat";
import { LOAI_O, type KyTuO } from "@/features/minigame/giao-hoi";
import { BieuTuongO } from "@/features/minigame/BieuTuongO";
import { useAuth } from "@/lib/auth-context";
import { so } from "@/lib/tien";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Game — ASTROTAROT" },
      {
        name: "description",
        content:
          "Mini game xếp ba biểu tượng Tarot. Điểm đổi được thành lượt hỏi Tarot AI miễn phí mỗi ngày.",
      },
    ],
  }),
  component: TrangGame,
});

const KHOA = ["game", "trang-thai"] as const;

function TrangGame() {
  const { user, openAuth, bootstrapping } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Đệm đáy rộng hơn mặc định: nút "Góp ý" nổi cố định ở góc trái dưới cùng
          cao chừng 44px cộng lề, nên pb-16 vẫn để nó đè lên khối cuối trang. */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <header className="mb-5">
          <h1 className="font-display text-3xl text-gold">Game</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-gold-soft">Giao Hội</span> — xếp ba biểu tượng
            cùng loại cho chúng giao hội. Điểm kiếm được đổi thành lượt hỏi
            Tarot AI.
          </p>
        </header>

        {bootstrapping ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-gold" />
          </div>
        ) : !user ? (
          <ChuaDangNhap onDangNhap={() => openAuth("login")} />
        ) : (
          <KhuChoi />
        )}
      </main>
    </div>
  );
}

/**
 * Khách chưa đăng nhập.
 *
 * Trang này nằm trong thanh điều hướng công khai, nên người chưa đăng nhập bấm
 * vào là chuyện thường. Đá họ về trang chủ thì họ không hiểu vừa xảy ra gì;
 * nói rõ cần đăng nhập và vì sao thì họ tự quyết định được.
 */
function ChuaDangNhap({ onDangNhap }: { onDangNhap: () => void }) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-card p-6 text-center">
      <Sparkles className="mx-auto size-6 text-gold" aria-hidden="true" />
      <h2 className="mt-3 font-display text-xl text-foreground">
        Đăng nhập để chơi
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Điểm trong game cộng vào hạn mức Tarot AI của chính bạn, nên cần biết
        bạn là ai mới cộng được.
      </p>
      <button
        type="button"
        onClick={onDangNhap}
        className="mt-4 rounded-lg bg-gold px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-gold/90"
      >
        Đăng nhập
      </button>
    </div>
  );
}

function KhuChoi() {
  const qc = useQueryClient();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: KHOA,
    queryFn: layTrangThai,
    // Hạn mức đổi khi chơi xong, và phiên dở thì nằm ở máy chủ. Lấy lại mỗi
    // lần quay về tab thì con số trên màn không lệch với thứ máy chủ đang giữ.
    refetchOnWindowFocus: true,
  });

  // Phiên giữ ở state riêng chứ không đọc thẳng từ query: mỗi nước đi trả về
  // phiên mới, mà gọi lại /trang-thai sau từng nước đi là thêm một lượt mạng
  // cho mỗi lần bấm — trên 3G thì bàn đứng một nhịp sau mỗi nước.
  const [phien, setPhien] = useState<Phien | null>(null);
  useEffect(() => {
    if (data) setPhien(data.phienDangMo);
  }, [data]);

  const [hanMuc, setHanMuc] = useState<Pick<
    TrangThaiGame,
    | "diemDaTinhHomNay"
    | "luotDaNhanHomNay"
    | "diemConDuocTinh"
    | "luotConDuocNhan"
  > | null>(null);
  useEffect(() => {
    if (data) setHanMuc(data);
  }, [data]);

  const moPhien = useMutation({
    mutationFn: (ma: MaNhanVat) => batDauPhien(ma),
    onSuccess: (tt) => {
      setPhien(tt.phienDangMo);
      setHanMuc(tt);
      qc.setQueryData(KHOA, tt);
    },
    onError: () => toast.error("Không mở được phiên chơi. Thử lại nhé."),
  });

  const diemMoiLuot = data?.diemMoiLuot ?? 0;

  function nhanThuong(t: Thuong) {
    setHanMuc(t);
    if (t.luotVuaNhan > 0) {
      toast.success(
        `Bạn được thêm ${so(t.luotVuaNhan)} lượt Tarot AI hôm nay`,
        {
          description: `Đã quy đổi ${so(t.diemTinhVaoQuyDoi)} điểm. Còn nhận được ${so(t.luotConDuocNhan)} lượt nữa hôm nay.`,
          duration: 7000,
        },
      );
    } else if (t.diemConDuocTinh === 0) {
      toast("Hôm nay đã quy đổi hết hạn mức", {
        description:
          "Chơi thêm vẫn được, chỉ là điểm không cộng vào quy đổi nữa. Mai hạn mức mở lại.",
      });
    } else {
      // Không nhẩm "còn thiếu bao nhiêu điểm nữa" ở đây. Mốc quy đổi là luật
      // của máy chủ; tự chia lại ở giao diện là để hai bên có ngày lệch nhau,
      // và người chơi đọc một con số không ai kiểm được.
      toast(`Phiên này được ${so(t.diemTinhVaoQuyDoi)} điểm`, {
        description: `Tổng hôm nay ${so(t.diemDaTinhHomNay)} điểm. Đủ ${so(diemMoiLuot)} điểm là thêm một lượt Tarot AI.`,
      });
    }
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-gold" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive-soft/30 bg-card p-5 text-center">
        <AlertCircle
          className="mx-auto size-5 text-destructive-soft"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm text-destructive-soft">
          {error instanceof Error ? error.message : "Không tải được mini game."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded-lg border border-gold/50 bg-gold/20 px-4 py-1.5 text-xs text-gold hover:bg-gold/10"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const hm = hanMuc ?? data;

  // Bảng hạn mức nằm DƯỚI bàn chơi.
  //
  // Để nó lên đầu thì trên màn điện thoại cao 812px, bàn chơi bắt đầu ở quá
  // nửa trang thứ hai — mở trang ra không thấy một ô nào, phải cuộn mới gặp
  // thứ mình vào để làm. Hạn mức là thông tin tra thỉnh thoảng, không phải
  // thứ nhìn trong lúc chơi, nên nó nhường chỗ.
  return (
    <div className="flex flex-col gap-4">
      {phien && !phien.daChot ? (
        <>
          <ThanhDiem phien={phien} luotMoiPhien={data.luotMoiPhien} />
          <BanGiaoHoi
            phien={phien}
            canhBan={data.canhBan}
            onPhien={setPhien}
            onThuong={nhanThuong}
          />
        </>
      ) : (
        <>
          {phien?.daChot && (
            <KetPhien
              phien={phien}
              dangGui={moPhien.isPending}
              onChoiLai={() => moPhien.mutate(phien.nhanVat.ma)}
            />
          )}
          <div className="rounded-2xl border border-gold/20 bg-card p-4">
            <ChonNhanVat
              cacNhanVat={data.cacNhanVat}
              dangGui={moPhien.isPending}
              onChon={(ma) => moPhien.mutate(ma)}
            />
          </div>
        </>
      )}

      <BangHanMuc luat={data} hanMuc={hm} />
      <ChuGiai />
    </div>
  );
}

/**
 * Hạn mức hôm nay.
 *
 * ## Vì sao in nguyên các con số máy chủ gửi, không tự nhẩm
 *
 * Trần điểm và trần lượt là luật của máy chủ. Nếu giao diện tự chia điểm cho
 * mốc rồi đoán số lượt thì có ngày hai bên lệch nhau, và người chơi đọc "còn
 * 2 lượt" rồi chơi xong không thấy lượt nào — một lỗi không ai bắt được từ
 * phía giao diện, vì giao diện tính rất đúng theo luật nó đang tin.
 */
function BangHanMuc({
  luat,
  hanMuc,
}: {
  luat: TrangThaiGame;
  hanMuc: Pick<
    TrangThaiGame,
    | "diemDaTinhHomNay"
    | "luotDaNhanHomNay"
    | "diemConDuocTinh"
    | "luotConDuocNhan"
  >;
}) {
  const ptDiem = Math.min(
    100,
    Math.round((hanMuc.diemDaTinhHomNay / luat.tranDiemNgay) * 100),
  );

  return (
    <section className="rounded-2xl border border-gold/30 bg-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-lg text-gold">Hôm nay</h2>
        <p className="text-2xs text-muted-foreground">
          {so(luat.diemMoiLuot)} điểm = 1 lượt Tarot AI · tối đa{" "}
          {so(luat.tranLuotNgay)} lượt mỗi ngày
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Điểm đã quy đổi</span>
            <span className="tabular-nums text-foreground">
              {so(hanMuc.diemDaTinhHomNay)} / {so(luat.tranDiemNgay)}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={ptDiem}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Điểm đã quy đổi hôm nay"
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${ptDiem}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Lượt AI đã thưởng</span>
            <span className="tabular-nums text-foreground">
              {so(hanMuc.luotDaNhanHomNay)} / {so(luat.tranLuotNgay)}
            </span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: luat.tranLuotNgay }, (_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < hanMuc.luotDaNhanHomNay ? "bg-gold" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-2xs text-muted-foreground">
        Lượt thưởng cộng vào hạn mức Tarot AI của hôm nay và hết hạn cuối ngày,
        y như hạn mức thường. Dùng ở{" "}
        <Link
          to="/tarot"
          className="text-gold underline-offset-2 hover:underline"
        >
          trang Tarot AI
        </Link>
        .
      </p>
    </section>
  );
}

function ThanhDiem({
  phien,
  luotMoiPhien,
}: {
  phien: Phien;
  luotMoiPhien: number;
}) {
  const sapHet = phien.luotConLai <= 3;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-card px-4 py-3">
      <div>
        <div className="text-3xs uppercase tracking-wider text-muted-foreground">
          Điểm phiên này
        </div>
        <div className="font-display text-2xl tabular-nums text-gold">
          {so(phien.diem)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xs uppercase tracking-wider text-muted-foreground">
          Lượt còn lại
        </div>
        <div
          className={`font-display text-2xl tabular-nums ${
            sapHet ? "text-destructive-soft" : "text-foreground"
          }`}
        >
          {so(phien.luotConLai)}
          <span className="ml-1 text-xs text-muted-foreground">
            / {so(luotMoiPhien)}
          </span>
        </div>
      </div>
    </div>
  );
}

function KetPhien({
  phien,
  dangGui,
  onChoiLai,
}: {
  phien: Phien;
  dangGui: boolean;
  onChoiLai: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gold/50 bg-gold/10 p-4 text-center">
      <p className="text-3xs uppercase tracking-wider text-muted-foreground">
        Hết lượt
      </p>
      <p className="font-display text-3xl tabular-nums text-gold">
        {so(phien.diem)} điểm
      </p>
      <button
        type="button"
        disabled={dangGui}
        onClick={onChoiLai}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-gold/90 disabled:opacity-60"
      >
        {dangGui ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RotateCcw className="size-4" aria-hidden="true" />
        )}
        Chơi lại với {phien.nhanVat.ten}
      </button>
    </div>
  );
}

/**
 * Bảng chú giải sáu biểu tượng.
 *
 * Người chơi mới nhìn bàn chỉ thấy sáu hình lạ. Nói tên chúng ra thì bàn đọc
 * được thành "ba lá Cốc" chứ không phải "ba hình xanh giống nhau" — và đó cũng
 * là chỗ duy nhất gắn game lại với chủ đề Tarot của sản phẩm.
 */
function ChuGiai() {
  const cac = Object.keys(LOAI_O) as KyTuO[];
  return (
    <section className="rounded-2xl border border-gold/20 bg-card p-4">
      <h2 className="mb-2 font-display text-base text-gold">Sáu biểu tượng</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {cac.map((k) => (
          <li key={k} className="flex flex-col items-center gap-1">
            <BieuTuongO loai={k} className="size-7" />
            <span className="text-2xs text-muted-foreground">
              {LOAI_O[k].ten}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-2xs text-muted-foreground">
        Gậy, Cốc, Gươm, Tiền là bốn hoa của bộ ẩn phụ trong Tarot. Sao và Trăng
        là hai lá của bộ ẩn chính.
      </p>
    </section>
  );
}
