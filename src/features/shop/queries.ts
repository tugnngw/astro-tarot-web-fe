// ============================================================
// SHOP — React Query hooks
//
// Dự án đã có QueryClientProvider sẵn (src/router.tsx), nên phần shop dùng
// React Query thay vì useEffect + useState thủ công. Được: cache giữa các
// lần điều hướng, tự dedupe request trùng, trạng thái loading/error thống
// nhất, và invalidate sau mutation thay vì tự đồng bộ state bằng tay.
// ============================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import * as shopApi from "@/api/shop";
import type { Cart, ProductQuery } from "@/api/shop";

/**
 * Khoá cache tập trung một chỗ. Gom lại như vậy để invalidate không bị lệch
 * khoá so với lúc query — lỗi này rất khó thấy khi khoá rải rác trong component.
 */
export const shopKeys = {
  all: ["shop"] as const,
  categories: () => [...shopKeys.all, "categories"] as const,
  products: (query: ProductQuery) =>
    [...shopKeys.all, "products", query] as const,
  featured: () => [...shopKeys.all, "products", "featured"] as const,
  product: (slug: string) => [...shopKeys.all, "product", slug] as const,
  cart: () => [...shopKeys.all, "cart"] as const,
  orders: () => [...shopKeys.all, "orders"] as const,
};

/** Catalog gần như tĩnh, giữ cache 5 phút để chuyển trang không phải tải lại. */
const CATALOG_STALE_TIME = 5 * 60 * 1000;

// ---------- Catalog ----------

export function useCategories() {
  return useQuery({
    queryKey: shopKeys.categories(),
    queryFn: shopApi.getCategories,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: shopKeys.products(query),
    queryFn: () => shopApi.getProducts(query),
    // Giữ trang cũ trong lúc tải trang mới, tránh danh sách nháy về skeleton
    // mỗi lần đổi bộ lọc hoặc bấm phân trang.
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: shopKeys.featured(),
    queryFn: shopApi.getFeaturedProducts,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: shopKeys.product(slug),
    queryFn: () => shopApi.getProduct(slug),
    enabled: Boolean(slug),
    // Sản phẩm không tồn tại thì retry cũng vô ích.
    retry: false,
  });
}

// ---------- Giỏ hàng ----------

export function useCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: shopKeys.cart(),
    queryFn: shopApi.getCart,
    // Khách chưa đăng nhập không có giỏ ở BE.
    enabled,
    staleTime: 0,
  });
}

/**
 * Mọi thao tác ghi vào giỏ đều trả về giỏ đầy đủ, nên ghi thẳng kết quả vào
 * cache thay vì invalidate rồi fetch lại — đỡ một vòng request.
 */
function useCartMutation<TArgs>(fn: (args: TArgs) => Promise<Cart>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => queryClient.setQueryData(shopKeys.cart(), cart),
  });
}

export function useAddToCart() {
  return useCartMutation(
    ({ productId, quantity }: { productId: string; quantity: number }) =>
      shopApi.addToCart(productId, quantity),
  );
}

export function useUpdateCartItem() {
  return useCartMutation(
    ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      shopApi.updateCartItem(cartItemId, quantity),
  );
}

export function useRemoveCartItem() {
  return useCartMutation((cartItemId: string) =>
    shopApi.removeCartItem(cartItemId),
  );
}

// ---------- Đơn hàng ----------

export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: shopKeys.orders(),
    queryFn: shopApi.getMyOrders,
    enabled,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shopApi.checkout,
    onSuccess: () => {
      // Checkout đụng tới cả ba: giỏ bị xoá, có đơn mới, tồn kho đã giảm.
      queryClient.setQueryData<Cart>(shopKeys.cart(), {
        items: [],
        totalQuantity: 0,
        subtotal: 0,
      });
      void queryClient.invalidateQueries({ queryKey: shopKeys.orders() });
      void queryClient.invalidateQueries({ queryKey: shopKeys.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      shopApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      // Huỷ đơn hoàn tồn kho nên danh sách sản phẩm cũng đã cũ.
      void queryClient.invalidateQueries({ queryKey: shopKeys.orders() });
      void queryClient.invalidateQueries({ queryKey: shopKeys.all });
    },
  });
}
