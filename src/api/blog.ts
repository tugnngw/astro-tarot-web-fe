// src/api/blog.ts
import { apiFetch } from "./client";
import type {
  BlogListResponse,
  BlogResponse,
  BlogStatus,
  CreateBlogRequest,
  ReviewBlogRequest,
  UpdateBlogRequest,
} from "./types";

export interface PaginationParams {
  page?: number;
  size?: number;
}

const BASE = "/api/v1";

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

/**
 * Lấy danh sách bài viết công khai (PUBLISHED).
 * Khách chưa đăng nhập cũng xem được.
 */
export async function listPublicBlogs(
  params: PaginationParams & { keyword?: string } = {},
): Promise<BlogListResponse> {
  const query = new URLSearchParams();
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.size === "number") query.set("size", String(params.size));
  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());

  const qs = query.toString();
  return apiFetch<BlogListResponse>(
    `${BASE}/blogs${qs ? `?${qs}` : ""}`,
    {},
    { auth: false },
  );
}

/**
 * Lấy chi tiết bài viết công khai theo slug (status = PUBLISHED).
 */
export async function getBlogBySlug(slug: string): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/blogs/${encodeURIComponent(slug)}`,
    {},
    { auth: false },
  );
}

// ============================================================
// MANAGER / ADMIN ENDPOINTS (Quyền: BLOG_REVIEW)
// ============================================================

/**
 * Xem toàn bộ danh sách bài viết (tất cả các trạng thái).
 */
export async function listAllBlogs(
  params: PaginationParams & { status?: BlogStatus; keyword?: string } = {},
): Promise<BlogListResponse> {
  const query = new URLSearchParams();
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.size === "number") query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());

  const qs = query.toString();
  return apiFetch<BlogListResponse>(
    `${BASE}/blogs/all${qs ? `?${qs}` : ""}`,
    {},
    { auth: true },
  );
}

/**
 * Duyệt bài viết (APPROVED hoặc REJECTED).
 */
export async function reviewBlog(
  id: string,
  request: ReviewBlogRequest,
): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/blogs/${id}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(request),
    },
    { auth: true },
  );
}

/**
 * Xuất bản bài viết đã được duyệt (APPROVED -> PUBLISHED).
 */
export async function publishBlog(id: string): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/blogs/${id}/publish`,
    {
      method: "PATCH",
    },
    { auth: true },
  );
}

/**
 * Quản lý / Admin xóa bài viết.
 */
export async function deleteBlogAdmin(id: string): Promise<void> {
  await apiFetch<void>(
    `${BASE}/blogs/${id}`,
    {
      method: "DELETE",
    },
    { auth: true },
  );
}

// ============================================================
// STAFF / AUTHOR ENDPOINTS (Quyền: BLOG_CREATE)
// ============================================================

/**
 * Tạo bài viết mới (trạng thái ban đầu: DRAFT).
 */
export async function createStaffBlog(
  request: CreateBlogRequest,
): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/staff/blogs`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
    { auth: true },
  );
}

/**
 * Cập nhật bài viết của mình (cho phép khi ở DRAFT, PENDING, REJECTED).
 */
export async function updateStaffBlog(
  id: string,
  request: UpdateBlogRequest,
): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/staff/blogs/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
    { auth: true },
  );
}

/**
 * Gửi bài viết đi chờ duyệt (DRAFT / REJECTED -> PENDING).
 */
export async function submitStaffBlog(id: string): Promise<BlogResponse> {
  return apiFetch<BlogResponse>(
    `${BASE}/staff/blogs/${id}/submit`,
    {
      method: "PATCH",
    },
    { auth: true },
  );
}

/**
 * Xem danh sách bài viết của chính tác giả (tất cả các trạng thái).
 */
export async function listMyBlogs(
  params: PaginationParams & { status?: BlogStatus; keyword?: string } = {},
): Promise<BlogListResponse> {
  const query = new URLSearchParams();
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.size === "number") query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());

  const qs = query.toString();
  return apiFetch<BlogListResponse>(
    `${BASE}/staff/blogs/me${qs ? `?${qs}` : ""}`,
    {},
    { auth: true },
  );
}

/**
 * Tác giả xóa bài viết nháp của chính mình (chỉ khi ở DRAFT).
 */
export async function deleteStaffBlog(id: string): Promise<void> {
  await apiFetch<void>(
    `/staff/blogs/${id}`,
    {
      method: "DELETE",
    },
    { auth: true },
  );
}
