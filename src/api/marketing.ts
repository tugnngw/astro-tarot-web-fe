import { apiFetch } from "./client";

export interface TrackMarketingPayload {
  eventName: string;
  path?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  metadata?: string | null;
}

export function trackMarketingEvent(payload: TrackMarketingPayload) {
  return apiFetch<void>("/api/v1/marketing/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMarketingSummary() {
  return apiFetch<Record<string, number>>("/api/v1/marketing/events/summary");
}
