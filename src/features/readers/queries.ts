// ============================================================
// READER — React Query hooks
//
// Danh sách và hồ sơ Reader là dữ liệu công khai: khách chưa đăng nhập cũng
// gọi được, nên các hook này không cần chờ trạng thái đăng nhập.
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReader, getVerifiedReaders } from "@/api/reader";
import * as readerApi from "@/api/reader";

export const readerKeys = {
  all: ["readers"] as const,
  list: () => [...readerKeys.all, "list"] as const,
  detail: (id: string) => [...readerKeys.all, "detail", id] as const,
};

/** Danh sách Reader đã được duyệt. Đổi chậm nên giữ cache 2 phút. */
export function useReaders() {
  return useQuery({
    queryKey: readerKeys.list(),
    queryFn: getVerifiedReaders,
    staleTime: 2 * 60 * 1000,
  });
}

export function useReader(id: string) {
  return useQuery({
    queryKey: readerKeys.detail(id),
    queryFn: () => getReader(id),
    enabled: Boolean(id),
    // Hồ sơ không tồn tại thì thử lại cũng không đổi kết quả.
    retry: false,
  });
}

// ============================================================
// Khu làm việc của Reader — đơn đăng ký, hồ sơ, lịch rảnh, ngày nghỉ
//
// Các hook dưới đây đều cần đăng nhập. Mutation nào đổi dữ liệu thì dọn luôn
// cache danh sách công khai: đổi giá hay thêm khung giờ phải thấy ngay ở
// /readers, nếu không Reader sẽ tưởng mình lưu hụt.
// ============================================================

export const readerMeKeys = {
  application: ["readers", "me", "application"] as const,
  profile: ["readers", "me", "profile"] as const,
  availability: ["readers", "me", "availability"] as const,
  daysOff: ["readers", "me", "days-off"] as const,
};

/** Đơn đăng ký gần nhất của mình. `enabled` để không gọi khi chưa đăng nhập. */
export function useMyApplication(enabled = true) {
  return useQuery({
    queryKey: readerMeKeys.application,
    queryFn: readerApi.getMyApplication,
    enabled,
    retry: false,
  });
}

export function useApplyReader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.applyReader,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: readerMeKeys.application }),
  });
}

export function useMyReaderProfile(enabled = true) {
  return useQuery({
    queryKey: readerMeKeys.profile,
    queryFn: readerApi.getMyReaderProfile,
    enabled,
    retry: false,
  });
}

export function useUpdateReaderProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.updateReaderProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerMeKeys.profile });
      qc.invalidateQueries({ queryKey: readerKeys.all });
    },
  });
}

export function useAvailability(enabled = true) {
  return useQuery({
    queryKey: readerMeKeys.availability,
    queryFn: readerApi.getAvailability,
    enabled,
    retry: false,
  });
}

export function useCreateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.createAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerMeKeys.availability });
      qc.invalidateQueries({ queryKey: readerMeKeys.profile });
      qc.invalidateQueries({ queryKey: readerKeys.all });
    },
  });
}

export function useDeleteAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.deleteAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerMeKeys.availability });
      qc.invalidateQueries({ queryKey: readerMeKeys.profile });
      qc.invalidateQueries({ queryKey: readerKeys.all });
    },
  });
}

export function useUnavailableDates(enabled = true) {
  return useQuery({
    queryKey: readerMeKeys.daysOff,
    queryFn: readerApi.getUnavailableDates,
    enabled,
    retry: false,
  });
}

export function useAddUnavailableDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.addUnavailableDate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerMeKeys.daysOff });
      qc.invalidateQueries({ queryKey: readerMeKeys.profile });
    },
  });
}

export function useDeleteUnavailableDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readerApi.deleteUnavailableDate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerMeKeys.daysOff });
      qc.invalidateQueries({ queryKey: readerMeKeys.profile });
    },
  });
}
