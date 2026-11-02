// src/api/tarot.ts
import { ApiError, apiFetch } from "./client";
import { thongDiepLoi } from "@/components/ListError";

// ============================================================
// REQUEST DTO - Khớp với StartTarotReadingRequest của BE
// ============================================================
/**
 * Người thứ hai của một lượt xem đôi.
 *
 * Gửi kèm TỪNG yêu cầu chứ không lưu thành hồ sơ: người thứ hai không có tài
 * khoản, và nếu máy chủ nhớ hộ theo userId thì người của phiên trước sẽ còn
 * nguyên trong lượt xem một mình của phiên sau.
 *
 * Mọi trường đều không bắt buộc — người dùng hay biết tên mà không biết ngày
 * sinh của đối phương. Chỉ cần một cái tên cũng đủ để lời giải nói về hai
 * người thay vì một.
 */
export interface NguoiThuHai {
  name?: string;
  birthDate?: string; // yyyy-MM-dd
  birthTime?: string; // HH:mm:ss
  birthPlace?: string;
  timezone?: string;
}

export interface StartTarotReadingRequest {
  question: string; // Câu hỏi của user (bắt buộc)
  numberOfCards?: number; // Số lá bài (mặc định 3)
  includeReversed?: boolean; // Có bao gồm lá ngược (mặc định true)
  spreadName?: string; // Tên spread (mặc định "Past-Present-Future")
  nguoiThuHai?: NguoiThuHai | null; // Chỉ có ở lượt xem đôi
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
    nguoiThuHai: request.nguoiThuHai ?? null,
  };

  return apiFetch<TarotReadingResult>("/api/ai-readings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ChatResponse {
  reply?: string;
  response?: string;
}

/**
 * `nguoiThuHai` phải đi kèm MỌI tin nhắn của một phiên xem đôi, không chỉ lúc
 * rút bài. Máy chủ dựng lại ngữ cảnh chiêm tinh từ đầu ở mỗi lượt và không
 * lưu người thứ hai ở đâu cả, nên bỏ sót một lần là lượt ấy quay về một
 * người — mà câu trả lời vẫn trôi chảy nên không ai thấy.
 */
export function sendChat(
  message: string,
  readingId: string | null,
  nguoiThuHai?: NguoiThuHai | null,
) {
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, readingId, nguoiThuHai: nguoiThuHai ?? null }),
  });
}

/** Câu fallback thân thiện khi lỗi không phân loại được. */
const CHAT_FALLBACK =
  "Xin lỗi cậu, mình đang gặp vấn đề kết nối. Cậu có thể thử lại sau nhé! 💫";

/**
 * Dịch lỗi chat sang câu người dùng đọc được.
 *
 * ApiError (mạng / timeout / backend) dùng translator có sẵn `thongDiepLoi`.
 * Lỗi thô của browser (TypeError "Failed to fetch", AbortError…) KHÔNG được
 * in ra — trả về câu fallback thân thiện thay vì lộ kỹ thuật vào bubble chat.
 */
export function chatErrorReply(
  error: unknown,
  readingId: string | null,
): string {
  if (error instanceof ApiError) {
    if (error.status === 404 && readingId) {
      return "⚠️ Không tìm thấy phiên chat. Vui lòng rút bài lại.";
    }
    if (error.status === 503 || error.message.includes("high demand")) {
      return "🔮 Dịch vụ AI đang quá tải. Vui lòng thử lại sau vài phút.";
    }
    if (error.status === 401 || error.message.includes("Unauthorized")) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    // status 0 NETWORK/TIMEOUT → thongDiepLoi đã có câu tiếng Việt chuẩn.
    // status 5xx → câu "máy chủ đang bận", KHÔNG phải câu mạng.
    // Còn lại → giữ message backend nếu có.
    return thongDiepLoi(error, CHAT_FALLBACK);
  }

  // TypeError("Failed to fetch"), AbortError, DOMException… — không lộ kỹ thuật.
  // AbortError không có cancel path riêng trong chat hiện tại → coi như lỗi mạng.
  return CHAT_FALLBACK;
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
  return apiFetch<ReadingHistoryPage>(
    `/api/ai-readings?page=${page}&size=${size}`,
  );
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

/**
 * Báo một lời giải do AI sinh là không ổn.
 *
 * Chính sách AI tạo sinh của CH Play buộc ứng dụng có nội dung do AI sinh phải
 * cho người dùng báo cáo nội dung không phù hợp ngay trong ứng dụng.
 *
 * Máy chủ trả êm cả khi người dùng bấm lại lần hai — với họ thì lần nào cũng
 * là "đã báo rồi".
 */
export function baoCaoNoiDungAi(
  readingId: string,
  lyDo: string,
  moTa: string,
) {
  return apiFetch<void>("/api/ai-readings/reports", {
    method: "POST",
    body: JSON.stringify({ readingId, lyDo, moTa: moTa.trim() }),
  });
}
