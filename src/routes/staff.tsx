// Bàn làm việc của Nhân viên (STAFF).
//
// STAFF gánh hai vai: hỗ trợ khách, và nhận booking với tư cách Reader —
// READER cũ đã gộp vào STAFF (xem migration V2_0 và src/lib/roles.ts).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MessageCircle, Star } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { NotWiredYet, WorkspaceShell } from "@/components/WorkspaceShell";
import { getMyReaderProfile } from "@/api/reader";
import { ApiError } from "@/api/client";
import { formatVND } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Bàn làm việc — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["SUPPORT_VIEW"]}>
      <StaffWorkspace />
    </RoleGuard>
  ),
});

function StaffWorkspace() {
  // Quản lý cũng có SUPPORT_VIEW nên vào được trang này để giám sát hàng chờ,
  // nhưng họ không có READER_MANAGE_PROFILE. Ẩn hẳn tab Reader thay vì để họ
  // bấm vào rồi nhận 403 — đúng tinh thần "không bày nút bấm vào sẽ hỏng".
  const { can } = useAuth();

  return (
    <WorkspaceShell
      title="Bàn làm việc"
      subtitle="Nơi xử lý yêu cầu hỗ trợ của khách và quản lý phần việc Reader của bạn."
      tabs={[
        {
          key: "support",
          label: "Hỗ trợ khách",
          render: () => <SupportQueue />,
        },
        ...(can("READER_MANAGE_PROFILE")
          ? [
              {
                key: "reader",
                label: "Hồ sơ Reader",
                render: () => <ReaderPanel />,
              },
            ]
          : []),
      ]}
    />
  );
}

function SupportQueue() {
  return (
    <div className="space-y-4">
      <NotWiredYet
        title="Hàng chờ hỗ trợ"
        what="Danh sách câu hỏi của khách đang chờ trả lời, kèm lịch sử trao đổi và trạng thái xử lý."
        missing="BE chưa có endpoint cho hàng chờ hỗ trợ. Quyền SUPPORT_VIEW và SUPPORT_RESPOND đã có sẵn, chỉ còn thiếu API và bảng lưu ticket."
      />
      <p className="text-xs text-muted-foreground">
        Ô này để trống có chủ ý. Bày một danh sách ticket giả ở đây thì nhìn thì
        đủ, nhưng nhân viên sẽ tưởng là việc thật và ngồi xử lý dữ liệu không có
        ai gửi.
      </p>
    </div>
  );
}

function ReaderPanel() {
  const query = useQuery({
    queryKey: ["reader", "profile", "me"],
    queryFn: getMyReaderProfile,
    // Chưa có hồ sơ thì BE trả 404 — thử lại cũng không đổi kết quả.
    retry: false,
  });

  if (query.isPending) {
    return <div className="glass h-40 animate-pulse rounded-2xl" aria-busy="true" />;
  }

  // Nhân viên được cất nhắc thẳng từ trang quản lý thì chưa qua luồng nộp hồ sơ,
  // nên chưa có ReaderProfile. Đó là trạng thái bình thường, không phải lỗi.
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <section className="glass rounded-2xl px-5 py-8 text-center">
        <Star aria-hidden="true" className="mx-auto h-8 w-8 text-gold/50" />
        <h3 className="mt-3 font-display text-lg">
          {notFound ? "Bạn chưa có hồ sơ Reader" : "Không tải được hồ sơ Reader"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {notFound
            ? "Tài khoản nhân viên chỉ có hồ sơ Reader sau khi hồ sơ xin làm Reader được duyệt. Nếu bạn được cất nhắc thẳng, hãy nhờ quản lý tạo hồ sơ giúp."
            : query.error instanceof Error
              ? query.error.message
              : "Lỗi không xác định."}
        </p>
      </section>
    );
  }

  const p = query.data;
  const specialties = p.specialties ?? [];
  const weekly = p.weeklyAvailability ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="glass rounded-2xl p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">@{p.username}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.yearsExperience != null
                ? `${p.yearsExperience} năm kinh nghiệm`
                : "Chưa ghi kinh nghiệm"}
              {" · "}
              {p.isAvailable ? (
                <span className="text-emerald-300">Đang nhận lịch</span>
              ) : (
                <span className="text-muted-foreground">Tạm ngưng nhận lịch</span>
              )}
            </p>
          </div>
          <Link
            to="/reader-hub"
            className="rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10"
          >
            Mở Reader Hub
          </Link>
        </div>

        {p.bio && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.bio}</p>
        )}

        {specialties.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {specialties.map((s) => (
              <li
                key={s}
                className="rounded-full border border-gold/25 px-2.5 py-0.5 text-[11px] text-gold/80"
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <PriceCell label="15 phút" value={p.pricePer15m} />
          <PriceCell label="30 phút" value={p.pricePer30m} />
          <PriceCell label="60 phút" value={p.pricePer60m} />
        </dl>
      </section>

      <div className="space-y-4">
        <section className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Star aria-hidden="true" className="h-4 w-4 text-gold" />
            Đánh giá
          </h3>
          <p className="mt-2 text-2xl text-gold">
            {p.rating != null ? Number(p.rating).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {p.totalReviews ?? 0} lượt đánh giá
          </p>
        </section>

        <section className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-gold" />
            Lịch rảnh hằng tuần
          </h3>
          {weekly.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Chưa khai báo khung giờ nào. Khách sẽ không đặt được lịch với bạn.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {weekly.map((w) => (
                <li key={w.id}>
                  {DAY_LABEL[w.dayOfWeek] ?? `Thứ ${w.dayOfWeek}`}: {w.startTime}–
                  {w.endTime}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <MessageCircle aria-hidden="true" className="h-4 w-4 text-gold" />
            Booking
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Danh sách lịch hẹn thật chưa nối được: BE chưa có endpoint đọc
            bookings của Reader.
          </p>
        </section>
      </div>
    </div>
  );
}

function PriceCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-gold/20 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display text-lg text-gold">
        {value != null ? formatVND(value) : "Chưa đặt giá"}
      </dd>
    </div>
  );
}

/** BE dùng 0 = Chủ nhật, theo quy ước của java.time.DayOfWeek.getValue() % 7. */
const DAY_LABEL: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};
