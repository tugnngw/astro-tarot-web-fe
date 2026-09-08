const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "refresh_token";

export const tokenStore = {
  get: () =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  set: (t: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, t);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REFRESH_KEY, t);
  },
};
