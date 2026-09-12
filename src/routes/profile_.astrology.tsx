// Bản đồ sao của người dùng — nền của trụ cột 1 ("đọc theo bản đồ sao ngày sinh").
//
// Trước đây trang này chỉ LIỆT KÊ và XOÁ. Không có đường tạo (hồ sơ chỉ sinh ra
// như tác dụng phụ lúc trải bài ở /tarot) và không có đường sửa, nên gõ nhầm
// giờ sinh là phải xoá làm lại từ đầu. Giờ đủ cả bốn: xem, thêm, sửa, xoá.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AstrologyProfileForm } from "@/features/astrology/components/AstrologyProfileForm";
import {
  createAstrologyProfile,
  deleteAstrologyProfile,
  getAstrologyProfiles,
  updateAstrologyProfile,
  type AstrologyProfile,
  type CreateAstrologyProfileRequest,
  type ProfileType,
} from "@/api/astrology";

import { PAGE_SIZE, PagedList, Pagination } from "@/components/Pagination";
export const Route = createFileRoute("/profile_/astrology")({
  head: () => ({ meta: [{ title: "Bản đồ sao — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard require={["USER_BASIC"]}>
      <AstrologyProfilesPage />
    </RoleGuard>
  ),
});

const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  SELF: "Của tôi",
  OTHER: "Người khác",
  COUPLE: "Cặp đôi",
};

const astrologyKeys = { all: ["astrology", "profiles"] as const };

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

function AstrologyProfilesPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: astrologyKeys.all,
    queryFn: getAstrologyProfiles,
  });

  // null = form đóng; "new" = tạo mới; object = đang sửa hồ sơ đó.
  const [editing, setEditing] = useState<AstrologyProfile | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AstrologyProfile | null>(null);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: astrologyKeys.all });

  const create = useMutation({
    mutationFn: createAstrologyProfile,
    onSuccess: () => {
      toast.success("Đã tạo hồ sơ");
      setEditing(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không tạo được hồ sơ."),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateAstrologyProfileRequest;
    }) => updateAstrologyProfile(id, data),
    onSuccess: () => {
      toast.success("Đã lưu thay đổi");
      setEditing(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không lưu được thay đổi."),
  });

  const remove = useMutation({
    mutationFn: deleteAstrologyProfile,
    onSuccess: () => {
      toast.success("Đã xoá hồ sơ");
      setToDelete(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không xoá được hồ sơ."),
  });

  const tatCaHoSo = query.data ?? [];

  // BE trả cả mảng một lượt (số bản đồ sao của một người vốn ít), nên cắt
  // trang ngay tại đây thay vì thêm tham số phân trang cho endpoint đó.
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(tatCaHoSo.length / PAGE_SIZE));
  const trangHienTai = Math.min(page, totalPages - 1);
  const profiles = tatCaHoSo.slice(
    trangHienTai * PAGE_SIZE,
    (trangHienTai + 1) * PAGE_SIZE,
  );

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-gold" />
              <h1 className="font-display text-3xl sm:text-4xl">Bản đồ sao</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ngày, giờ và nơi sinh quyết định lá số của bạn. AI đọc bài dựa
              trên hồ sơ chính, nên sai một chi tiết ở đây là lời giải lệch
              theo.
            </p>
          </div>
          {editing === null && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-background transition hover:bg-gold/90"
            >
              <Plus className="h-4 w-4" />
              Thêm hồ sơ
            </button>
          )}
        </div>

        {editing !== null && (
          <div className="mt-6">
            <AstrologyProfileForm
              profile={editing === "new" ? undefined : editing}
              submitting={create.isPending || update.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(data) =>
                editing === "new"
                  ? create.mutate(data)
                  : update.mutate({ id: editing.id, data })
              }
            />
          </div>
        )}

        <div className="mt-6">
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
              Không tải được danh sách hồ sơ. Thử lại sau.
            </div>
          ) : profiles.length === 0 ? (
            <div className="glass flex flex-col items-center gap-2 rounded-2xl py-12 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 text-gold/70" />
              <p className="text-sm">Bạn chưa có hồ sơ chiêm tinh nào.</p>
              <p className="max-w-sm text-xs">
                Thêm một hồ sơ ở đây, hoặc để hệ thống tự tạo khi bạn{" "}
                <Link
                  to="/tarot"
                  className="text-gold underline-offset-4 hover:underline"
                >
                  trải bài lần đầu
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <PagedList>
                <ul className="space-y-3">
                  {profiles.map((p) => (
                    <li key={p.id} className="glass rounded-2xl p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="flex flex-wrap items-center gap-2 font-display text-xl text-gold-soft">
                            {p.title}
                            {p.isPrimary && (
                              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-gold">
                                Hồ sơ chính
                              </span>
                            )}
                            <span className="rounded-full border border-gold/25 px-2 py-0.5 text-[11px] text-gold/80">
                              {PROFILE_TYPE_LABEL[p.profileType] ??
                                p.profileType}
                            </span>
                          </h3>
                          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                            <Row
                              label="Tên người được xem"
                              value={p.targetName}
                            />
                            <Row
                              label="Ngày sinh"
                              value={fmtDate(p.birthDate)}
                            />
                            <Row
                              label="Giờ sinh"
                              value={
                                p.birthTime ? p.birthTime.slice(0, 5) : null
                              }
                              fallback="Chưa biết giờ"
                            />
                            <Row label="Nơi sinh" value={p.birthPlace} />
                            <Row label="Múi giờ" value={p.timezone} />
                            <Row
                              label="Toạ độ"
                              value={
                                p.latitude != null && p.longitude != null
                                  ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                                  : null
                              }
                            />
                          </dl>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-sm text-gold transition hover:bg-gold/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            aria-label={`Xoá hồ sơ ${p.title}`}
                            onClick={() => setToDelete(p)}
                            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </PagedList>
              <Pagination
                page={trangHienTai}
                totalPages={totalPages}
                totalElements={tatCaHoSo.length}
                onChange={setPage}
                unit="bản đồ sao"
              />
            </>
          )}
        </div>
      </main>

      {/* Xoá hồ sơ là mất hẳn dữ liệu ngày giờ sinh đã nhập — hỏi lại bằng hộp
          thoại của app thay vì confirm() trần của trình duyệt. */}
      <ConfirmDialog
        open={toDelete !== null}
        title="Xoá hồ sơ chiêm tinh?"
        description={
          toDelete
            ? `"${toDelete.title}" sẽ bị xoá hẳn. Lời giải AI đã lưu vẫn còn, nhưng lần trải bài sau sẽ không dùng được hồ sơ này nữa.`
            : ""
        }
        confirmLabel={remove.isPending ? "Đang xoá…" : "Xoá hồ sơ"}
        destructive
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Row({
  label,
  value,
  fallback = "—",
}: {
  label: string;
  value: string | null | undefined;
  fallback?: string;
}) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 truncate text-foreground/90">
        {value || fallback}
      </dd>
    </div>
  );
}
