// src/features/blog/queries.ts
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaffBlog,
  deleteBlogAdmin,
  deleteStaffBlog,
  getBlogBySlug,
  listAllBlogs,
  listMyBlogs,
  listPublicBlogs,
  publishBlog,
  reviewBlog,
  submitStaffBlog,
  updateStaffBlog,
  type PaginationParams,
} from "@/api/blog";
import type {
  BlogStatus,
  CreateBlogRequest,
  ReviewBlogRequest,
  UpdateBlogRequest,
} from "@/api/types";

export const blogKeys = {
  all: ["blogs"] as const,
  publicList: (params?: PaginationParams & { keyword?: string }) =>
    [...blogKeys.all, "public", params ?? {}] as const,
  slug: (slug: string) => [...blogKeys.all, "detail", slug] as const,
  myList: (
    params?: PaginationParams & { status?: BlogStatus; keyword?: string },
  ) => [...blogKeys.all, "my", params ?? {}] as const,
  adminList: (
    params?: PaginationParams & { status?: BlogStatus; keyword?: string },
  ) => [...blogKeys.all, "admin", params ?? {}] as const,
};

// ============================================================
// QUERIES
// ============================================================

export function usePublicBlogs(
  params: PaginationParams & { keyword?: string } = {},
) {
  return useQuery({
    queryKey: blogKeys.publicList(params),
    queryFn: () => listPublicBlogs(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useBlogBySlug(slug: string) {
  return useQuery({
    queryKey: blogKeys.slug(slug),
    queryFn: () => getBlogBySlug(slug),
    enabled: Boolean(slug && slug.trim().length > 0),
    staleTime: 60_000,
  });
}

export function useMyBlogs(
  params: PaginationParams & { status?: BlogStatus; keyword?: string } = {},
) {
  return useQuery({
    queryKey: blogKeys.myList(params),
    queryFn: () => listMyBlogs(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllBlogs(
  params: PaginationParams & { status?: BlogStatus; keyword?: string } = {},
) {
  return useQuery({
    queryKey: blogKeys.adminList(params),
    queryFn: () => listAllBlogs(params),
    placeholderData: keepPreviousData,
  });
}

// ============================================================
// MUTATIONS (STAFF / AUTHOR)
// ============================================================

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBlogRequest) => createStaffBlog(data),
    onSuccess: () => {
      toast.success("Đã tạo bài viết nháp thành công");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể tạo bài viết");
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogRequest }) =>
      updateStaffBlog(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật bài viết thành công");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể cập nhật bài viết");
    },
  });
}

export function useSubmitBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitStaffBlog(id),
    onSuccess: () => {
      toast.success("Đã gửi bài viết chờ duyệt thành công");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể gửi duyệt bài viết");
    },
  });
}

export function useDeleteStaffBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStaffBlog(id),
    onSuccess: () => {
      toast.success("Đã xóa bài viết nháp thành công");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể xóa bài viết");
    },
  });
}

// ============================================================
// MUTATIONS (MANAGER / ADMIN)
// ============================================================

export function useReviewBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ReviewBlogRequest }) =>
      reviewBlog(id, request),
    onSuccess: (_, vars) => {
      if (vars.request.action === "APPROVED") {
        toast.success("Đã duyệt bài viết thành công");
      } else if (vars.request.action === "REJECTED") {
        toast.success("Đã từ chối bài viết");
      }
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể duyệt bài viết");
    },
  });
}

export function usePublishBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishBlog(id),
    onSuccess: () => {
      toast.success("Đã xuất bản bài viết thành công lên trang công khai");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể xuất bản bài viết");
    },
  });
}

export function useDeleteAdminBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogAdmin(id),
    onSuccess: () => {
      toast.success("Đã xóa bài viết thành công");
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể xóa bài viết");
    },
  });
}
