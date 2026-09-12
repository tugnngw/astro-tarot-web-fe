// Danh sách Reader — trụ cột 2, cửa vào của toàn bộ luồng đặt lịch.
//
// Trang này trước đây chạy trên mảng READERS trong mock-data.ts. Nó trông như
// đã xong nên rất dễ bị bỏ quên, mà người dùng thật thì tin vào những cái tên
// và mức giá bịa ra ở đó. Nay đọc từ GET /api/v1/readers.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { Search, Star, UserSearch } from "lucide-react";
import { Header } from "@/components/Header";
import { useReaders } from "@/features/readers/queries";
import { formatVND } from "@/lib/mock-data";
import type { ReaderProfile } from "@/api/reader";

import { ListError, useTaiLau, SlowHint } from "@/components/ListError";
import {
  PAGE_SIZE,
  Pagination,
  PagedList,
  useCoTrangVuaManHinh,
} from "@/components/Pagination";
export const Route = createFileRoute("/readers")({
  head: () => ({
    meta: [
      { title: "Tìm Reader — ASTROTAROT" },
      {
        name: "description",
        content: "Đặt lịch với các Reader Tarot và Chiêm tinh đã được duyệt.",
      },
    ],
  }),
  component: ReadersPage,
});

function ReadersPage() {
  const query = useReaders();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  // Cỡ trang theo màn hình thật: một trang vừa một màn, khỏi cuộn
  // xuống mới bấm được sang trang.
  const listRef = useRef<HTMLDivElement>(null);
  const coTrang = useCoTrangVuaManHinh(listRef, { buoc: 2 });

  const readers = useMemo(() => {
    const all = query.data ?? [];
    const kw = keyword.trim().toLowerCase();
    if (!kw) return all;
    // Lọc ở phía trình duyệt: số Reader đã duyệt còn nhỏ, thêm một endpoint
    // tìm kiếm lúc này là phức tạp hoá mà không đổi được gì cho người dùng.
    return all.filter((r) =>
      [r.fullName, r.username, r.bio, ...(r.specialties ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(kw)),
    );
  }, [query.data, keyword]);

  // Lọc xong mà vẫn đứng ở trang 5 thì màn hình trống trơn — về đầu.
  useEffect(() => {
    setPage(0);
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(readers.length / coTrang));
  const trangHienTai = Math.min(page, totalPages - 1);
  const readersTrangNay = readers.slice(
    trangHienTai * coTrang,
    (trangHienTai + 1) * coTrang,
  );

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">
          Kết nối với <span className="text-gradient-gold">Reader thật</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Mỗi Reader ở đây đều đã qua duyệt hồ sơ. Chọn khung giờ trống, đặt
          lịch, và đánh giá sau khi buổi xem hoàn tất.
        </p>

        <div className="relative mt-6 max-w-md">
          <label htmlFor="reader-search" className="sr-only">
            Tìm Reader theo tên hoặc chuyên môn
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="reader-search"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên Reader hoặc chuyên môn..."
            className="w-full rounded-full border border-gold/30 bg-input/70 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <div className="mt-8" aria-live="polite" aria-busy={query.isFetching}>
          {query.isError ? (
            <ListError
              error={query.error}
              onRetry={() => void query.refetch()}
              title="Không tải được danh sách Reader"
              className="glass rounded-2xl px-6 py-14"
            />
          ) : query.isPending ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="glass h-52 animate-pulse rounded-2xl"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : readers.length === 0 ? (
            <div className="glass flex flex-col items-center rounded-2xl px-6 py-16 text-center">
              <UserSearch
                aria-hidden="true"
                className="h-10 w-10 text-gold/50"
              />
              <h2 className="mt-4 font-display text-xl">
                {keyword ? "Không có Reader nào khớp" : "Chưa có Reader nào"}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {keyword
                  ? `Không tìm thấy Reader nào cho "${keyword}". Thử từ khoá khác nhé.`
                  : "Hồ sơ Reader phải được duyệt mới xuất hiện ở đây. Bạn cũng có thể nộp hồ sơ để trở thành Reader."}
              </p>
            </div>
          ) : (
            <>
              {/* PagedList giữ chiều cao: trang cuối ít thẻ hơn thì cả khối
                  không tụt lên, nút "Trang sau" đứng yên dưới ngón tay. */}
              <PagedList pageSize={coTrang} listRef={listRef}>
                <div className="grid gap-5 md:grid-cols-2">
                  {readersTrangNay.map((r) => (
                    <ReaderCard key={r.id} reader={r} />
                  ))}
                </div>
              </PagedList>
              <Pagination
                page={trangHienTai}
                totalPages={totalPages}
                totalElements={readers.length}
                onChange={setPage}
                pageSize={coTrang}
                unit="Reader"
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ReaderCard({ reader }: { reader: ReaderProfile }) {
  const name = reader.fullName ?? `@${reader.username}`;
  const specialties = reader.specialties ?? [];
  const cheapest =
    reader.pricePer15m ?? reader.pricePer30m ?? reader.pricePer60m;

  return (
    <article className="card-hover glass flex flex-col rounded-2xl p-6">
      <div className="flex items-start gap-4">
        {reader.avatar ? (
          <img
            src={reader.avatar}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-gold/40"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-gold bg-card font-display text-2xl text-gold"
          >
            {name.charAt(name.startsWith("@") ? 1 : 0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight">
            <Link
              to="/readers/$id"
              params={{ id: reader.id }}
              className="text-foreground transition hover:text-gold"
            >
              {name}
            </Link>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {reader.yearsExperience
              ? `${reader.yearsExperience} năm kinh nghiệm`
              : "Reader mới"}
            {reader.isAvailable === false && (
              <span className="ml-2 text-amber-300">tạm ngưng nhận lịch</span>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs">
            <Star
              aria-hidden="true"
              className="h-3.5 w-3.5 fill-gold text-gold"
            />
            <span className="text-gold">
              {reader.totalReviews
                ? Number(reader.rating ?? 0).toFixed(1)
                : "Chưa có"}
            </span>
            <span className="text-muted-foreground">
              {reader.totalReviews
                ? `(${reader.totalReviews} đánh giá)`
                : "đánh giá"}
            </span>
          </p>
        </div>

        {cheapest != null && (
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-muted-foreground">chỉ từ</div>
            <div className="font-display text-xl text-gold">
              {formatVND(cheapest)}
            </div>
          </div>
        )}
      </div>

      {reader.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {reader.bio}
        </p>
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

      <div className="mt-auto pt-5">
        <Link
          to="/readers/$id"
          params={{ id: reader.id }}
          className="block rounded-full bg-gold py-2.5 text-center text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02]"
        >
          Xem hồ sơ và đặt lịch
        </Link>
      </div>
    </article>
  );
}
