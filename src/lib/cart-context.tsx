// src/lib/cart-context.tsx
// ============================================================
// Giỏ hàng dùng chung cho toàn app.
//
// Giỏ nằm ở BE (bảng cart_items) chứ không phải localStorage, nên nó theo
// người dùng qua các thiết bị.
//
// Nguồn sự thật là cache của React Query, không phải useState trong provider.
// Provider chỉ bọc lại thành một API gọn cho component dùng — nhờ vậy Header,
// trang Shop và trang Giỏ luôn thấy cùng một dữ liệu mà không cần đồng bộ tay.
// ============================================================

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Cart } from "@/api/shop";
import {
  useAddToCart,
  useCartQuery,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/features/shop/queries";
import { useAuth } from "@/lib/auth-context";

interface CartCtx {
  cart: Cart | null;
  /** Đang tải giỏ lần đầu. */
  loading: boolean;
  /** Một thao tác ghi đang chạy — dùng để khoá nút, tránh double-click. */
  busy: boolean;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (cartItemId: string, quantity: number) => Promise<void>;
  remove: (cartItemId: string) => Promise<void>;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  const cartQuery = useCartQuery(false); // Shop = affiliate Shopee — tắt giỏ legacy
  const addMutation = useAddToCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const value = useMemo<CartCtx>(
    () => ({
      cart: isLoggedIn ? (cartQuery.data ?? null) : null,
      loading: cartQuery.isLoading,
      busy:
        addMutation.isPending ||
        updateMutation.isPending ||
        removeMutation.isPending,
      // mutateAsync ném lỗi ra ngoài để chỗ gọi hiện toast với thông điệp thật
      // từ BE (ví dụ "chỉ còn 3 sản phẩm").
      add: async (productId, quantity = 1) => {
        await addMutation.mutateAsync({ productId, quantity });
      },
      update: async (cartItemId, quantity) => {
        await updateMutation.mutateAsync({ cartItemId, quantity });
      },
      remove: async (cartItemId) => {
        await removeMutation.mutateAsync(cartItemId);
      },
    }),
    [
      isLoggedIn,
      cartQuery.data,
      cartQuery.isLoading,
      addMutation,
      updateMutation,
      removeMutation,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart phải được dùng bên trong <CartProvider>");
  return ctx;
}
