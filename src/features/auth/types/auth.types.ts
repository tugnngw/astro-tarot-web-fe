export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "USER" | "READER" | "ADMIN";
  status: "ACTIVE" | "BANNED" | "PENDING";
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}
