// STOMP over WebSocket — kênh realtime từ BE (/ws → /user/queue/events).
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_BASE, ensureAccessToken, isLiveBackend } from "@/api/client";
import type { Notification } from "@/api/notifications";

export type RealtimeEvent = {
  kind: string;
  type: string;
  unreadCount: number;
  notification: Notification;
};

type StatusListener = (connected: boolean) => void;
type EventListener = (event: RealtimeEvent) => void;

let client: Client | null = null;
let subscription: StompSubscription | null = null;
let connected = false;

const statusListeners = new Set<StatusListener>();
const eventListeners = new Set<EventListener>();

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn(value));
}

function wsBrokerUrl(): string {
  const base = API_BASE.replace(/\/$/, "");
  if (base.startsWith("https://")) return `wss://${base.slice("https://".length)}/ws`;
  if (base.startsWith("http://")) return `ws://${base.slice("http://".length)}/ws`;
  // Relative / same-origin proxy — giả định https khi trang là https.
  const proto = typeof window !== "undefined" && window.location.protocol === "https:"
    ? "wss:"
    : "ws:";
  const host =
    typeof window !== "undefined" ? window.location.host : "localhost:8080";
  return `${proto}//${host}/ws`;
}

function parseEvent(message: IMessage): RealtimeEvent | null {
  try {
    const raw = JSON.parse(message.body) as RealtimeEvent;
    if (!raw || typeof raw !== "object") return null;
    return raw;
  } catch {
    return null;
  }
}

/** Chuông đọc cờ này để quyết định có cần polling fallback không. */
export function isRealtimeConnected() {
  return connected;
}

export function subscribeRealtimeStatus(listener: StatusListener) {
  statusListeners.add(listener);
  listener(connected);
  return () => {
    statusListeners.delete(listener);
  };
}

export function subscribeRealtimeEvents(listener: EventListener) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

/**
 * Bật (hoặc giữ) kết nối STOMP khi đã đăng nhập.
 * Gọi lại an toàn — chỉ tạo Client một lần.
 */
export function connectRealtime() {
  if (typeof window === "undefined") return;
  if (!isLiveBackend()) return;

  if (client) {
    if (!client.active) client.activate();
    return;
  }

  client = new Client({
    brokerURL: wsBrokerUrl(),
    reconnectDelay: 3_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    beforeConnect: async () => {
      const token = await ensureAccessToken();
      if (!token) {
        throw new Error("Không có access token cho STOMP");
      }
      client!.connectHeaders = {
        Authorization: `Bearer ${token}`,
      };
    },
    onConnect: () => {
      setConnected(true);
      subscription?.unsubscribe();
      subscription = client!.subscribe("/user/queue/events", (message) => {
        const event = parseEvent(message);
        if (!event) return;
        eventListeners.forEach((fn) => fn(event));
      });
    },
    onDisconnect: () => {
      setConnected(false);
      subscription = null;
    },
    onStompError: () => {
      setConnected(false);
    },
    onWebSocketClose: () => {
      setConnected(false);
    },
  });

  client.activate();
}

/** Ngắt hẳn khi đăng xuất. */
export function disconnectRealtime() {
  subscription?.unsubscribe();
  subscription = null;
  if (client) {
    void client.deactivate();
    client = null;
  }
  setConnected(false);
}
