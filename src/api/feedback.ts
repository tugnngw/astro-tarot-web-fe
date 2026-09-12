import { apiFetch } from "./client";

export interface FeedbackStatus {
  submitted: boolean;
  total: number;
  goal: number;
  goalMet: boolean;
}

export interface SubmitFeedbackPayload {
  source: "TAROT_AI" | "BOOKING" | "GENERAL" | "LANDING";
  nps: number;
  rating?: number | null;
  comment?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function submitFeedback(payload: SubmitFeedbackPayload) {
  return apiFetch<void>("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyFeedbackStatus() {
  return apiFetch<FeedbackStatus>("/api/v1/feedback/me/status");
}

/** Form Google dự phòng khi BE chưa sẵn / muốn thu thêm ngoài app. */
export const EXTERNAL_FEEDBACK_FORM_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined)) ||
  "https://forms.gle/";
