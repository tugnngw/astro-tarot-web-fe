// src/api/types.ts
// ============================================================
// TYPES — Khớp 1-1 với BE (snake_case)
// ============================================================

/**
 * Vai trò người dùng. READER cũ đã gộp vào STAFF ở BE (migration V2_0) —
 * xem src/lib/roles.ts.
 */
export type UserRole = "USER" | "STAFF" | "MANAGER" | "ADMIN";
/** Trạng thái tài khoản */
export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

/** Bảng `users` — response từ BE */
export interface User {
  id: string;
  username: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  status: UserStatus;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================
// AUTH
// ============================================================

/** Auth response từ BE */
export interface AuthResult {
  user: User;
  /** Quyền của vai trò, do BE cấp. Chỉ dùng để hiện/ẩn giao diện. */
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// USER ASTROLOGICAL DATA
// ============================================================

export type AstroProfileType = "SELF" | "OTHER" | "COUPLE";

export interface AstrologicalData {
  id: string;
  user_id: string;
  profile_type: AstroProfileType;
  title: string;
  target_name?: string | null;
  birth_date: string;
  birth_time?: string | null;
  birth_place?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// READER PROFILES
// ============================================================

export interface ReaderProfile {
  id: string;
  user_id: string;
  bio?: string | null;
  specialties: string[];
  years_experience: number;
  price_per_15m?: number | null;
  price_per_30m?: number | null;
  price_per_60m?: number | null;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  verified_at?: string | null;
  user?: Pick<User, "id" | "full_name" | "avatar">;
}

export interface ReaderAvailability {
  id: string;
  reader_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ============================================================
// BOOKINGS
// ============================================================

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "ESCROW";

export interface Booking {
  id: string;
  user_id: string;
  reader_profile_id: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// TAROT
// ============================================================

export interface TarotReading {
  id: string;
  user_id: string;
  booking_id?: string | null;
  astro_profile_id?: string | null;
  session_type: "AI" | "READER";
  main_question: string;
  ai_model_used?: string | null;
  total_tokens_used: number;
  created_at: string;
}

export interface ReadingCard {
  id: string;
  reading_id: string;
  card_id: string;
  position: number;
  is_reversed: boolean;
  interpretation?: string | null;
}

// ============================================================
// CHAT
// ============================================================

export interface ChatSession {
  id: string;
  user_id: string;
  tarot_reading_id?: string | null;
  booking_id?: string | null;
  session_type: "AI" | "READER";
  status: "ACTIVE" | "CLOSED";
  last_message_at?: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: "USER" | "AI" | "READER" | "SYSTEM";
  sender_id?: string | null;
  content: string;
  message_type: "TEXT" | "IMAGE" | "CARD";
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

/** Hợp đồng response chuẩn của BE */
export interface ApiEnvelope<T> {
  data: T | null;
  error?: { code: string; message: string } | null;
  message?: string | null;
}
