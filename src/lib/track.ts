import { track } from "@vercel/analytics";
import { trackMarketingEvent } from "@/api/marketing";
import { readStoredUtm } from "@/lib/utm";

/**
 * Ghi CTA vừa lên Vercel Analytics vừa lên BE (CAP / OC2).
 * Lỗi mạng không làm hỏng UX — fire-and-forget.
 */
export function trackCta(
  eventName: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
) {
  try {
    track(eventName, extra as Record<string, string | number | boolean>);
  } catch {
    /* Vercel Analytics có thể chưa sẵn trên local */
  }

  const utm = readStoredUtm();
  void trackMarketingEvent({
    eventName,
    path: typeof window !== "undefined" ? window.location.pathname : null,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    metadata: extra ? JSON.stringify(extra) : null,
  }).catch(() => {
    /* ignore */
  });
}
