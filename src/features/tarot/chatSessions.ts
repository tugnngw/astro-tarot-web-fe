// Quản lý nhiều phiên chat Tarot AI trên localStorage (kiểu sidebar Session của ASM_PRN222).
import type { TarotReadingResult } from "@/api/tarot";

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  ts: number;
}

export interface PersonSnapshot {
  id: string;
  name: string;
  dob: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lng: number;
  altitude: number;
  timezone: string;
  timezoneOffset: number;
}

export interface TarotChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  drawnCards: string[];
  readingResult: TarotReadingResult | null;
  cardsDrawn: boolean;
  readingId: string | null;
  people: PersonSnapshot[];
}

export interface ChatVault {
  activeId: string | null;
  sessions: TarotChatSession[];
}

const LEGACY_PREFIX = "astrotarot_chat_";
const VAULT_PREFIX = "astrotarot_chat_vault_";

export function vaultKey(uid: string) {
  return `${VAULT_PREFIX}${uid}`;
}

export function legacyKey(uid: string) {
  return `${LEGACY_PREFIX}${uid}`;
}

export function titleFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  if (!firstUser) return "Phiên mới";
  const t = firstUser.content.trim().replace(/\s+/g, " ");
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

export function emptySession(
  people: PersonSnapshot[] = [],
  id = cryptoRandomId(),
): TarotChatSession {
  return {
    id,
    title: "Phiên mới",
    updatedAt: Date.now(),
    messages: [],
    drawnCards: [],
    readingResult: null,
    cardsDrawn: false,
    readingId: null,
    people,
  };
}

function cryptoRandomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadVault(uid: string): ChatVault {
  try {
    const raw = localStorage.getItem(vaultKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as ChatVault;
      if (parsed && Array.isArray(parsed.sessions)) {
        return {
          activeId: parsed.activeId ?? parsed.sessions[0]?.id ?? null,
          sessions: parsed.sessions,
        };
      }
    }

    // Migrate bản 1 phiên cũ
    const legacy = localStorage.getItem(legacyKey(uid));
    if (legacy) {
      const data = JSON.parse(legacy);
      if (Array.isArray(data?.messages) && data.messages.length) {
        const session: TarotChatSession = {
          id: cryptoRandomId(),
          title: titleFromMessages(data.messages),
          updatedAt: Date.now(),
          messages: data.messages,
          drawnCards: data.drawnCards ?? [],
          readingResult: data.readingResult ?? null,
          cardsDrawn: Boolean(data.cardsDrawn),
          readingId: data.readingId ?? null,
          people: data.people ?? [],
        };
        const vault: ChatVault = { activeId: session.id, sessions: [session] };
        saveVault(uid, vault);
        localStorage.removeItem(legacyKey(uid));
        return vault;
      }
    }
  } catch {
    /* ignore */
  }
  return { activeId: null, sessions: [] };
}

export function saveVault(uid: string, vault: ChatVault) {
  try {
    localStorage.setItem(vaultKey(uid), JSON.stringify(vault));
  } catch {
    /* ignore */
  }
}

export function upsertActiveSession(
  vault: ChatVault,
  session: TarotChatSession,
): ChatVault {
  const others = vault.sessions.filter((s) => s.id !== session.id);
  return {
    activeId: session.id,
    sessions: [session, ...others].sort((a, b) => b.updatedAt - a.updatedAt),
  };
}

export function deleteSession(vault: ChatVault, sessionId: string): ChatVault {
  const sessions = vault.sessions.filter((s) => s.id !== sessionId);
  const activeId =
    vault.activeId === sessionId
      ? (sessions[0]?.id ?? null)
      : vault.activeId;
  return { activeId, sessions };
}

/** Dọn vault của user khác (giữ nguyên hành vi cũ). */
export function cleanForeignVaults(currentUid: string) {
  try {
    const keepV = vaultKey(currentUid);
    const keepL = legacyKey(currentUid);
    Object.keys(localStorage)
      .filter(
        (k) =>
          (k.startsWith(VAULT_PREFIX) || k.startsWith(LEGACY_PREFIX)) &&
          k !== keepV &&
          k !== keepL,
      )
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
