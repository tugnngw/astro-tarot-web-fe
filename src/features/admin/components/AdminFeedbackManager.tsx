import { so } from "@/lib/tien";
import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Filter,
  MessageSquareHeart,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import {
  useAdminFeedbackList,
  useAdminFeedbackStats,
} from "@/features/admin/queries";
import { PagedList, Pagination } from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEEDBACK_PAGE_SIZE,
  SOURCE_VI,
  SOURCE_COLORS,
  formatDate,
} from "../feedback-utils";

/**
 * Quản trị Đánh giá & Góp ý hệ thống (Task A).
 * Hiển thị KPI, phân bổ sao 1–5, thống kê nguồn gửi, bộ lọc và danh sách phản hồi chi tiết.
 */
export function AdminFeedbackManager() {
  const [selectedRating, setSelectedRating] = useState<string>("__all__");
  const [selectedSource, setSelectedSource] = useState<string>("__all__");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [page, setPage] = useState<number>(0);

  const statsQuery = useAdminFeedbackStats();

  const queryParams = {
    rating: selectedRating !== "__all__" ? Number(selectedRating) : undefined,
    source: selectedSource !== "__all__" ? selectedSource : undefined,
    keyword: activeKeyword || undefined,
    page,
    size: FEEDBACK_PAGE_SIZE,
  };

  const listQuery = useAdminFeedbackList(queryParams);

  const stats = statsQuery.data;
  const items = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;
  const totalElements = listQuery.data?.totalElements ?? 0;

  function handleResetFilters() {
    setSelectedRating("__all__");
    setSelectedSource("__all__");
    setSearchKeyword("");
    setActiveKeyword("");
    setPage(0);
  }

  const isFiltered =
    selectedRating !== "__all__" ||
    selectedSource !== "__all__" ||
    Boolean(activeKeyword);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Tổng phản hồi */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng lượt góp ý
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-foreground">
              {statsQuery.isPending ? "…" : so(stats?.totalCount ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bao gồm khách vãng lai & thành viên
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-xs">
            <MessageSquareHeart className="h-6 w-6" />
          </div>
        </div>

        {/* Điểm đánh giá trung bình */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Đánh giá trung bình
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-gold">
                {statsQuery.isPending
                  ? "…"
                  : (stats?.averageRating ?? 0).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.00</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gold">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${
                    (stats?.averageRating ?? 0) >= s
                      ? "fill-gold text-gold"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-xs">
            <Star className="h-6 w-6 fill-gold" />
          </div>
        </div>

        {/* Điểm NPS trung bình */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Chỉ số giới thiệu (NPS)
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-foreground">
                {statsQuery.isPending
                  ? "…"
                  : stats?.averageNps != null
                    ? stats.averageNps.toFixed(1)
                    : "—"}
              </span>
              <span className="text-sm text-muted-foreground">/ 10.0</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.averageNps != null
                ? stats.averageNps >= 8.5
                  ? "Xuất sắc (Khách hàng tích cực)"
                  : stats.averageNps >= 7.0
                    ? "Tốt (Khách hàng hài lòng)"
                    : "Cần cải thiện thêm"
                : "Chưa có dữ liệu NPS"}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-xs">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Phân bổ đánh giá & Phân bổ nguồn */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Phân bổ mức sao 1–5 */}
        <div className="glass rounded-2xl p-5 lg:col-span-7">
          <h3 className="font-display text-lg text-foreground">
            Phân bổ mức độ hài lòng (1–5 sao)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tỉ lệ đánh giá theo từng mức sao trên tổng số{" "}
            {stats?.totalCount ?? 0} phản hồi.
          </p>

          <div className="mt-4 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats?.ratingDistribution?.[star] ?? 0;
              const total = stats?.totalCount ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex w-16 items-center gap-1 font-medium text-foreground">
                    <span>{star}</span>
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                  </div>
                  <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-mystic/15">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-20 text-right tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {count}
                    </span>{" "}
                    ({pct.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phân bổ theo nguồn thu thập */}
        <div className="glass rounded-2xl p-5 lg:col-span-5">
          <h3 className="font-display text-lg text-foreground">
            Nguồn thu thập phản hồi
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Vị trí người dùng gửi phản hồi trong ứng dụng.
          </p>

          <div className="mt-4 space-y-3">
            {["TAROT_AI", "BOOKING", "GENERAL", "LANDING"].map((src) => {
              const count = stats?.bySource?.[src] ?? 0;
              const total = stats?.totalCount ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const colorClass =
                SOURCE_COLORS[src] ?? "bg-gold/15 text-gold border-gold/30";

              return (
                <div
                  key={src}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-mystic/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-medium ${colorClass}`}
                    >
                      {SOURCE_VI[src] ?? src}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-semibold text-foreground">
                      {so(count)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danh sách phản hồi chi tiết & Bộ lọc */}
      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 pb-4">
          <div>
            <h2 className="font-display text-xl text-foreground">
              Danh sách phản hồi & góp ý
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Lọc theo số sao, nguồn gửi, hoặc tìm kiếm theo nội dung bình luận
              và người gửi.
            </p>
          </div>

          {/* Bộ lọc & Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Lọc theo sao */}
            <Select
              value={selectedRating}
              onValueChange={(v) => {
                setSelectedRating(v);
                setPage(0);
              }}
            >
              <SelectTrigger
                aria-label="Lọc theo số sao"
                className="h-9 w-auto min-w-[9rem] rounded-full border-gold/30 bg-input/70 px-3.5 text-xs text-foreground focus:ring-1 focus:ring-gold/40"
              >
                <SelectValue placeholder="Mọi mức sao" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-gold/30 bg-card text-foreground shadow-xl">
                <SelectItem value="__all__" className="text-xs">
                  Mọi mức sao
                </SelectItem>
                <SelectItem value="5" className="text-xs">
                  5 sao ★★★★★
                </SelectItem>
                <SelectItem value="4" className="text-xs">
                  4 sao ★★★★
                </SelectItem>
                <SelectItem value="3" className="text-xs">
                  3 sao ★★★
                </SelectItem>
                <SelectItem value="2" className="text-xs">
                  2 sao ★★
                </SelectItem>
                <SelectItem value="1" className="text-xs">
                  1 sao ★
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Lọc theo nguồn */}
            <Select
              value={selectedSource}
              onValueChange={(v) => {
                setSelectedSource(v);
                setPage(0);
              }}
            >
              <SelectTrigger
                aria-label="Lọc theo nguồn"
                className="h-9 w-auto min-w-[9rem] rounded-full border-gold/30 bg-input/70 px-3.5 text-xs text-foreground focus:ring-1 focus:ring-gold/40"
              >
                <SelectValue placeholder="Mọi nguồn gửi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-gold/30 bg-card text-foreground shadow-xl">
                <SelectItem value="__all__" className="text-xs">
                  Mọi nguồn gửi
                </SelectItem>
                {Object.entries(SOURCE_VI).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tìm kiếm từ khoá */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveKeyword(searchKeyword.trim());
                setPage(0);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm bình luận, họ tên, email…"
                className="h-9 w-48 rounded-full border border-gold/30 bg-input/70 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:w-60"
              />
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </form>

            {/* Nút đặt lại bộ lọc */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/30 px-3 text-xs text-gold transition hover:bg-gold/10"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="mt-4">
          {listQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-rose-400">
              <AlertCircle className="h-8 w-8" />
              <p className="mt-2 text-sm">
                {listQuery.error instanceof Error
                  ? listQuery.error.message
                  : "Không tải được danh sách phản hồi"}
              </p>
              <button
                type="button"
                onClick={() => void listQuery.refetch()}
                className="mt-3 rounded-full border border-gold/50 px-4 py-1.5 text-xs text-gold hover:bg-gold/10"
              >
                Thử lại
              </button>
            </div>
          ) : listQuery.isPending ? (
            <PagedList pageSize={FEEDBACK_PAGE_SIZE}>
              <div className="space-y-2" aria-busy="true">
                {Array.from({ length: FEEDBACK_PAGE_SIZE }, (_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-mystic/10"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </PagedList>
          ) : items.length === 0 ? (
            <PagedList pageSize={FEEDBACK_PAGE_SIZE}>
              <div className="flex flex-col items-center py-14 text-center">
                <MessageSquareHeart
                  aria-hidden="true"
                  className="h-9 w-9 text-gold/40"
                />
                <h3 className="mt-3 font-display text-lg text-foreground">
                  Không tìm thấy phản hồi nào
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {isFiltered
                    ? "Không có bản ghi nào khớp với điều kiện lọc hiện tại."
                    : "Chưa có phản hồi nào được ghi nhận trong hệ thống."}
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 rounded-full border border-gold/50 px-3.5 py-1.5 text-xs text-gold hover:bg-gold/10"
                  >
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            </PagedList>
          ) : (
            <PagedList
              key={`${selectedRating}-${selectedSource}-${activeKeyword}`}
              pageSize={FEEDBACK_PAGE_SIZE}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[10rem]" />
                    <col className="w-[18rem]" />
                    <col className="w-[12rem]" />
                    <col className="w-[9rem]" />
                    <col className="w-[10rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gold/20 text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="py-2.5 pr-3">
                        Đánh giá
                      </th>
                      <th scope="col" className="py-2.5 pr-3">
                        Góp ý
                      </th>
                      <th scope="col" className="py-2.5 pr-3">
                        Người gửi
                      </th>
                      <th scope="col" className="py-2.5 pr-3">
                        Nguồn & Chiến dịch
                      </th>
                      <th scope="col" className="py-2.5 text-right">
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((fb) => (
                      <tr
                        key={fb.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/2 last:border-0"
                      >
                        {/* Đánh giá */}
                        <td className="py-3 pr-3 align-top">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  fb.rating >= s
                                    ? "fill-gold text-gold"
                                    : "text-muted-foreground/25"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-bold text-gold">
                              {fb.rating}★
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="inline-block rounded-lg bg-mystic/20 px-2 py-0.5 text-2xs text-muted-foreground">
                              NPS: {fb.nps}/10
                            </span>
                          </div>
                        </td>

                        {/* Bình luận / Góp ý */}
                        <td className="py-3 pr-3 align-top">
                          {fb.comment ? (
                            <p className="line-clamp-3 text-xs leading-relaxed text-foreground whitespace-pre-line">
                              {fb.comment}
                            </p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground/50">
                              (Không có bình luận)
                            </span>
                          )}
                        </td>

                        {/* Người gửi */}
                        <td className="py-3 pr-3 align-top">
                          {fb.isAnonymous ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              Khách ẩn danh
                            </span>
                          ) : (
                            <div>
                              <p className="truncate text-xs font-medium text-foreground">
                                {fb.userFullName || fb.username || "Thành viên"}
                              </p>
                              {fb.userEmail && (
                                <p className="truncate text-2xs text-muted-foreground">
                                  {fb.userEmail}
                                </p>
                              )}
                              <span className="mt-0.5 inline-block text-3xs text-gold/75">
                                @{fb.username}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Nguồn & Kênh UTM */}
                        <td className="py-3 pr-3 align-top text-xs">
                          <div>
                            <span
                              className={`inline-block rounded-lg border px-2 py-0.5 text-2xs font-medium ${
                                SOURCE_COLORS[fb.source] ??
                                "bg-gold/15 text-gold border-gold/30"
                              }`}
                            >
                              {SOURCE_VI[fb.source] ?? fb.source}
                            </span>
                          </div>
                          {(fb.utmSource || fb.utmCampaign) && (
                            <div className="mt-1 space-y-0.5 text-3xs text-muted-foreground/80">
                              {fb.utmSource && (
                                <p className="truncate">
                                  utm_source:{" "}
                                  <span className="text-foreground">
                                    {fb.utmSource}
                                  </span>
                                </p>
                              )}
                              {fb.utmCampaign && (
                                <p className="truncate">
                                  campaign:{" "}
                                  <span className="text-foreground">
                                    {fb.utmCampaign}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Thời gian */}
                        <td className="py-3 text-right align-top text-xs tabular-nums text-muted-foreground">
                          <div>{formatDate(fb.createdAt)}</div>
                          {fb.updatedAt && fb.updatedAt !== fb.createdAt && (
                            <div
                              className="mt-0.5 text-3xs text-gold/70"
                              title={`Sửa lúc ${formatDate(fb.updatedAt)}`}
                            >
                              Đã sửa
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PagedList>
          )}
        </div>

        {/* Phân trang */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onChange={setPage}
          busy={listQuery.isFetching}
          unit="góp ý"
          pageSize={FEEDBACK_PAGE_SIZE}
        />
      </section>
    </div>
  );
}
