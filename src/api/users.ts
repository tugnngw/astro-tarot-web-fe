// src/api/users.ts
import { apiFetch } from "./client";
import type { User } from "./types";

export async function getMe(): Promise<User> {
  return apiFetch<User>("/users/me", { method: "GET" });
}

export async function updateMe(payload: Partial<User>): Promise<User> {
  return apiFetch<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
