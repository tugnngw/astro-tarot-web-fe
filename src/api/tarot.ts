// src/api/tarot.ts
import { apiFetch } from "./client";

// ============================================================
// REQUEST DTO - Khớp với StartTarotReadingRequest của BE
// ============================================================
export interface StartTarotReadingRequest {
  question: string; // Câu hỏi của user (bắt buộc)
  numberOfCards?: number; // Số lá bài (mặc định 3)
  includeReversed?: boolean; // Có bao gồm lá ngược (mặc định true)
  spreadName?: string; // Tên spread (mặc định "Past-Present-Future")
}

// ============================================================
// RESPONSE DTO - Khớp với TarotReadingResultDTO của BE
// ============================================================
export interface DrawnCardDetail {
  cardId: string;
  cardName: string; // Tên lá bài (The Fool, The Magician...)
  arcanaType: string; // Major Arcana, Cups, Wands...
  cardNumber: number | null;
  imageUrl: string | null;
  position: number; // 0, 1, 2...
  reversed: boolean; // true = ngược, false = xuôi
}

export interface TarotReadingResult {
  readingId: string;
  userQuestion: string;
  spreadName: string | null;
  drawnCards: DrawnCardDetail[];
  aiInterpretation: string; // Nội dung AI trả về từ Gemini
  modelUsed: string; // gemini-pro
  totalTokensUsed: number;
  readingTimestamp: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Bắt đầu một buổi đọc Tarot AI
 * BE: POST /api/ai-readings
 */
export async function startAiTarotReading(
  request: StartTarotReadingRequest,
): Promise<TarotReadingResult> {
  const payload = {
    question: request.question,
    numberOfCards: request.numberOfCards || 3,
    includeReversed:
      request.includeReversed !== undefined ? request.includeReversed : true,
    spreadName: request.spreadName || "Past-Present-Future",
  };

  return apiFetch<TarotReadingResult>("/api/ai-readings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// LỊCH SỬ TRẢI BÀI — GET /api/ai-readings
// Khớp ReadingHistoryItem + Page của BE. Mỗi người chỉ thấy lượt của mình
// (BE lấy danh tính từ token, không nhận userId từ ngoài).
// ============================================================

export interface ReadingHistoryItem {
  id: string;
  mainQuestion: string;
  sessionType: string | null;
  aiModelUsed: string | null;
  createdAt: string;
}

export interface ReadingHistoryPage {
  content: ReadingHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

export function getReadingHistory(page = 0, size = 20) {
  return apiFetch<ReadingHistoryPage>(`/api/ai-readings?page=${page}&size=${size}`);
}

/** Tin nhắn của một lượt trải bài — dùng để xem lại lời giải AI đã lưu. */
export interface ReadingMessage {
  id: string;
  senderType: string; // USER | AI
  content: string;
  createdAt: string;
}

export function getReadingMessages(readingId: string) {
  return apiFetch<ReadingMessage[] | { content: ReadingMessage[] }>(
    `/api/ai-readings/${readingId}/chat/messages`,
  );
}
