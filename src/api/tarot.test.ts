import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, PHIEN_HET_HAN, tokenStore } from "./client";
import { chatErrorReply, sendChat } from "./tarot";

const oldAccess = "old-access";
const oldRefresh = "old-refresh";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>();
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("sendChat", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.set(oldAccess, oldRefresh);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("gửi một yêu cầu chat thành công, không làm mới token", async () => {
    const fetchMock = mockFetch(json({ data: { reply: "Lá bài trả lời." } }, 201));

    await expect(sendChat("Điều gì đang chờ tôi?", null)).resolves.toEqual({
      reply: "Lá bài trả lời.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/chat");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ message: "Điều gì đang chờ tôi?", readingId: null }),
    });
  });

  it("làm mới token rồi chỉ gửi lại đúng một chat khi chat bị 401", async () => {
    const fetchMock = mockFetch(
      json({ message: "expired" }, 401),
      json({ data: { accessToken: "new-access", refreshToken: "new-refresh" } }),
      json({ data: { reply: "Đã trả lời sau khi làm mới." } }, 201),
    );

    await expect(sendChat("Hỏi tiếp", "reading-1")).resolves.toEqual({
      reply: "Đã trả lời sau khi làm mới.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/chat");
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")).toBe(
      "Bearer old-access",
    );
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[1][1]?.body).toBe(
      JSON.stringify({ refreshToken: oldRefresh }),
    );
    expect(fetchMock.mock.calls[2][0]).toContain("/api/chat");
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      body: JSON.stringify({ message: "Hỏi tiếp", readingId: "reading-1" }),
    });
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization")).toBe(
      "Bearer new-access",
    );
    expect(tokenStore.getAccess()).toBe("new-access");
    expect(tokenStore.getRefresh()).toBe("new-refresh");
  });

  it("dừng sau refresh bị từ chối và dùng xử lý phiên hết hạn có sẵn", async () => {
    const expired = vi.fn();
    window.addEventListener(PHIEN_HET_HAN, expired);
    const fetchMock = mockFetch(json({ message: "expired" }, 401), json({}, 401));

    await expect(sendChat("Hỏi tiếp", null)).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
    window.removeEventListener(PHIEN_HET_HAN, expired);
  });

  it("không gửi chat lần thứ ba khi retry vẫn 401", async () => {
    const fetchMock = mockFetch(
      json({ message: "expired" }, 401),
      json({ data: { accessToken: "new-access", refreshToken: "new-refresh" } }),
      json({ message: "still expired" }, 401),
    );

    await expect(sendChat("Hỏi tiếp", "reading-1")).rejects.toMatchObject({
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/chat"))).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/auth/refresh"))).toHaveLength(1);
  });

  it("lỗi mạng được bọc thành ApiError thân thiện, không ném TypeError thô", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const loi = await sendChat("Hỏi tiếp", null).catch((e) => e);
    expect(loi).toBeInstanceOf(ApiError);
    expect(loi.status).toBe(0);
    expect(loi.message).not.toMatch(/Failed to fetch|TypeError|NetworkError|ERR_/i);
    expect(loi.message).toContain("Không kết nối được máy chủ");
  });
});

describe("chatErrorReply", () => {
  const raw = [
    "Failed to fetch",
    "TypeError: Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "ERR_CONNECTION_REFUSED",
    "AbortError: The user aborted a request.",
  ];

  it("lỗi mạng thô không lộ kỹ thuật vào bubble chat", () => {
    for (const message of raw) {
      const reply = chatErrorReply(new TypeError(message), null);
      expect(reply).not.toMatch(/Failed to fetch|TypeError|NetworkError|ERR_/i);
      expect(reply.length).toBeGreaterThan(0);
    }
  });

  it("ApiError NETWORK dùng câu mạng có sẵn từ thongDiepLoi", () => {
    const reply = chatErrorReply(
      new ApiError(0, "NETWORK", "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."),
      null,
    );
    expect(reply).toBe("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    expect(reply).not.toMatch(/Failed to fetch|TypeError/i);
  });

  it("401 giữ behavior phiên hết hạn của TASK-007", () => {
    expect(
      chatErrorReply(new ApiError(401, "UNAUTHORIZED", "expired"), null),
    ).toBe("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    expect(
      chatErrorReply(new ApiError(401, "UNAUTHORIZED", "expired"), "r1"),
    ).toBe("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  });

  it("500 không bị biến thành câu mạng", () => {
    const reply = chatErrorReply(
      new ApiError(500, "INTERNAL", "Internal Server Error"),
      null,
    );
    expect(reply).toBe(
      "Máy chủ đang bận hoặc vừa khởi động lại. Chờ khoảng một phút rồi thử lại.",
    );
    expect(reply).not.toMatch(/Failed to fetch|Không kết nối/i);
  });

  it("lỗi nghiệp vụ backend giữ message nếu có", () => {
    expect(
      chatErrorReply(
        new ApiError(400, "VALIDATION", "Ngày sinh không hợp lệ"),
        null,
      ),
    ).toBe("Ngày sinh không hợp lệ");
  });

  it("404 chỉ map câu chat khi có readingId", () => {
    expect(
      chatErrorReply(new ApiError(404, "NOT_FOUND", "missing"), "r1"),
    ).toBe("⚠️ Không tìm thấy phiên chat. Vui lòng rút bài lại.");
    // Không có readingId → không dùng câu "phiên chat Tarot"
    expect(
      chatErrorReply(new ApiError(404, "NOT_FOUND", "missing"), null),
    ).not.toContain("phiên chat");
  });

  it("503 vẫn là câu AI quá tải", () => {
    expect(
      chatErrorReply(new ApiError(503, "UNAVAILABLE", "high demand"), null),
    ).toBe("🔮 Dịch vụ AI đang quá tải. Vui lòng thử lại sau vài phút.");
  });

  it("AbortError không lộ kỹ thuật (chat hiện không có cancel path riêng)", () => {
    const abort = new DOMException("The user aborted a request.", "AbortError");
    const reply = chatErrorReply(abort, null);
    expect(reply).not.toMatch(/Failed to fetch|AbortError|TypeError/i);
    expect(reply.length).toBeGreaterThan(0);
  });
});
