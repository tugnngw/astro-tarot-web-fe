// ============================================================
// TYPES — Khớp 1-1 với V1__init_schema.sql
// Đặt tên field theo snake_case để map thẳng từ JSON BE trả về.
// ============================================================

/** Vai trò người dùng (xem CHECK constraint bảng users) */
export type UserRole = "USER" | "READER" | "ADMIN";
/** Trạng thái tài khoản */
export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

/** Bảng `users` — bỏ password_hash vì FE không bao giờ thấy */
export interface User {
  id: string;                 // UUID
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  status: UserStatus;
  email_verified: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Bảng `user_astrological_data` — thông tin sinh trắc dùng cho tarot/chiêm tinh */
export type AstroProfileType = "SELF" | "OTHER" | "COUPLE";
export interface AstrologicalData {
  id: string;
  user_id: string;
  profile_type: AstroProfileType;
  title: string;              // tên gợi nhớ, vd "Bản thân", "Người yêu"
  target_name?: string | null;
  birth_date: string;         // YYYY-MM-DD
  birth_time?: string | null; // HH:MM:SS
  birth_place?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

/** Bảng `reader_profiles` */
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
  // join sẵn từ BE cho tiện hiển thị
  user?: Pick<User, "id" | "full_name" | "avatar">;
}

/** Bảng `reader_availability` — lịch theo thứ trong tuần */
export interface ReaderAvailability {
  id: string;
  reader_id: string;
  day_of_week: number;        // 0 = CN .. 6 = T7
  start_time: string;         // HH:MM
  end_time: string;
  is_active: boolean;
}

/** Bảng `bookings` */
export type BookingStatus =
  | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus =
  | "UNPAID" | "PAID" | "REFUNDED" | "ESCROW";
export interface Booking {
  id: string;
  user_id: string;
  reader_profile_id: string;
  start_time: string;         // ISO
  end_time: string;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
}

/** Bảng `tarot_readings` + `reading_cards` */
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

/** Chat */
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

/** Hợp đồng response chuẩn của BE */
export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}
