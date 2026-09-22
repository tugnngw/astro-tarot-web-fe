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

// ---------------------------------------------------------------
// Kênh phụ (chat, gọi) — đăng ký theo đích, tự nối lại sau khi rớt
// ---------------------------------------------------------------
//
// Không dùng client.subscribe() trực tiếp ở từng component. Lý do: mỗi lần
// STOMP nối lại là một phiên MỚI, mọi subscription của phiên cũ chết theo.
// Backend chạy trên gói free của Render, khởi động lại khá thường xuyên, nên
// "rớt rồi nối lại" là chuyện hằng ngày chứ không phải ngoại lệ. Component
// nào tự subscribe sẽ im lặng ngừng nhận tin sau lần rớt đầu tiên, mà giao
// diện vẫn báo "đã kết nối" — kiểu hỏng khó tìm nhất.
//
// Sổ đăng ký dưới đây là nguồn sự thật duy nhất; onConnect đăng ký lại tất cả.

type RawHandler = (body: unknown) => void;

const handlers = new Map<string, Set<RawHandler>>();
const liveSubs = new Map<string, StompSubscription>();

function bind(destination: string) {
  if (!client?.connected || liveSubs.has(destination)) return;
  liveSubs.set(
    destination,
    client.subscribe(destination, (message) => {
      let body: unknown;
      try {
        body = JSON.parse(message.body);
      } catch {
        return;
      }
      handlers.get(destination)?.forEach((fn) => fn(body));
    }),
  );
}

function bindAll() {
  handlers.forEach((_set, destination) => bind(destination));
}

function dropAllSubs() {
  liveSubs.forEach((sub) => {
    try {
      sub.unsubscribe();
    } catch {
      // Phiên đã chết thì không có gì để huỷ nữa.
    }
  });
  liveSubs.clear();
}

/**
 * Nghe một đích STOMP bất kỳ, ví dụ `/user/queue/booking-chat`.
 *
 * <p>Gọi được cả khi chưa kết nối — sẽ tự đăng ký ngay khi nối được, và đăng
 * ký lại sau mỗi lần nối lại.
 */
export function subscribeDestination<T>(
  destination: string,
  handler: (body: T) => void,
): () => void {
  const set = handlers.get(destination) ?? new Set<RawHandler>();
  set.add(handler as RawHandler);
  handlers.set(destination, set);
  bind(destination);

  return () => {
    const current = handlers.get(destination);
    if (!current) return;
    current.delete(handler as RawHandler);
    if (current.size > 0) return;

    handlers.delete(destination);
    liveSubs.get(destination)?.unsubscribe();
    liveSubs.delete(destination);
  };
}

/**
 * Gửi lên `/app/...`. Trả về false khi chưa có kết nối.
 *
 * <p>Người gọi PHẢI xử lý false — không được coi như đã gửi xong. Lối đi dự
 * phòng là gọi REST, xem `sendBookingMessage`.
 */
export function publishRealtime(destination: string, body: unknown): boolean {
  if (!client?.connected) return false;
  client.publish({ destination, body: JSON.stringify(body) });
  return true;
}

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
      // Phiên mới thì mọi subscription cũ đã chết — dựng lại từ sổ đăng ký.
      liveSubs.clear();
      bindAll();
    },
    onDisconnect: () => {
      setConnected(false);
      subscription = null;
      dropAllSubs();
    },
    onStompError: () => {
      setConnected(false);
    },
    onWebSocketClose: () => {
      setConnected(false);
      // Huỷ tham chiếu tới subscription của phiên đã chết, nếu không lần nối
      // lại sẽ thấy "đã đăng ký rồi" và bỏ qua, thành ra không nhận được gì.
      subscription = null;
      dropAllSubs();
    },
  });

  client.activate();
}

/** Ngắt hẳn khi đăng xuất. */
export function disconnectRealtime() {
  subscription?.unsubscribe();
  subscription = null;
  dropAllSubs();
  handlers.clear();
  if (client) {
    void client.deactivate();
    client = null;
  }
  setConnected(false);
}
