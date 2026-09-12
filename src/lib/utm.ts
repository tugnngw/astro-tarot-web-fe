const UTM_KEY = "astrotarot_utm";

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/** Đọc UTM từ URL lần đầu vào site, giữ trong localStorage cho đăng ký/feedback. */
export function captureUtmFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  if (!source && !medium && !campaign) return;
  const utm: UtmParams = {
    utmSource: source,
    utmMedium: medium,
    utmCampaign: campaign,
  };
  try {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    /* ignore quota */
  }
}

export function readStoredUtm(): UtmParams {
  if (typeof window === "undefined") {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return { utmSource: null, utmMedium: null, utmCampaign: null };
    const parsed = JSON.parse(raw) as UtmParams;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}
