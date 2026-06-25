import { api } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/token-store";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/auth.types";

export const authApi = {
  register: (data: RegisterRequest) =>
    api<void>("/auth/register", { method: "POST", body: data }),

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: data,
    });
    tokenStore.set(res.token);
    if (res.refreshToken) tokenStore.setRefresh(res.refreshToken);
    return res;
  },

  logout: async (): Promise<void> => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    tokenStore.clear();
  },
};

export const accountApi = {
  me: () => api<User>("/account/me"),
};
