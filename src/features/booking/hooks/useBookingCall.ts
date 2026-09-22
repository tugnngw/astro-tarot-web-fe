// Gọi thoại/video giữa khách và Reader, WebRTC điểm-tới-điểm.
//
// Tiếng và hình đi THẲNG giữa hai trình duyệt, không qua Render. Máy chủ chỉ
// chuyển tiếp mấy gói bắt tay (SDP, ICE) qua STOMP. Nhờ vậy hộp 512MB của gói
// free không phải là nút thắt dù có bao nhiêu cuộc gọi.
//
// ĐIỀU CẦN BIẾT TRƯỚC: dự án đang chạy CHỈ STUN, không TURN. STUN chỉ giúp hai
// máy tự dò ra địa chỉ công khai của nhau. Khi cả hai nằm sau NAT đối xứng —
// rất phổ biến với 4G ở Việt Nam vì nhà mạng dùng CGNAT — thì không có đường
// nào nối thẳng, và cuộc gọi sẽ đứng ở "đang kết nối" rồi thất bại. Wifi nhà
// hay mạng trường thì phần lớn chạy được. Hook này phát hiện và báo ra thay vì
// để người dùng ngồi chờ vô hạn.
import { useCallback, useEffect, useRef, useState } from "react";
import { getIceConfig } from "@/api/booking-chat";
import { publishRealtime, subscribeDestination } from "@/lib/realtime";

const CALL_QUEUE = "/user/queue/booking-call";

/** Bao lâu không nối được thì bỏ cuộc và nói thật với người dùng. */
const CONNECT_TIMEOUT_MS = 30_000;

export type CallState =
  | "idle"
  | "calling" // mình gọi đi, đang đổ chuông
  | "incoming" // có người gọi tới
  | "connecting" // đã nhận, đang bắt tay
  | "active"
  | "failed";

type SignalType = "OFFER" | "ANSWER" | "ICE" | "HANGUP" | "RINGING" | "BUSY";

interface Signal {
  type: SignalType;
  payload?: string;
  video?: boolean;
  /** Máy chủ tự điền — dùng để bỏ qua tín hiệu của buổi khác. */
  bookingId?: string;
  fromUserId?: string;
  fromName?: string;
}

export interface BookingCall {
  state: CallState;
  /** Tên người đang gọi tới, chỉ có nghĩa khi state === "incoming". */
  peerName: string | null;
  withVideo: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** Câu giải thích khi hỏng — đã viết cho người dùng đọc, không phải mã lỗi. */
  error: string | null;
  /** false = không có TURN, nên cảnh báo trước khi gọi. */
  hasTurn: boolean;
  micOn: boolean;
  camOn: boolean;
  start: (video: boolean) => Promise<void>;
  accept: () => Promise<void>;
  hangup: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
}

export function useBookingCall(bookingId: string | null): BookingCall {
  const [state, setState] = useState<CallState>("idle");
  const [peerName, setPeerName] = useState<string | null>(null);
  const [withVideo, setWithVideo] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTurn, setHasTurn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const iceServers = useRef<RTCIceServer[]>([]);
  /** Ứng viên ICE tới trước khi có remote description — phải xếp hàng, xem nạp() */
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const incomingOffer = useRef<string | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback(
    (signal: Signal) => {
      if (!bookingId) return;
      publishRealtime(`/app/bookings/${bookingId}/call`, signal);
    },
    [bookingId],
  );

  // ---- dọn dẹp ----
  // Gọi ở MỌI đường kết thúc: cúp máy, phía kia cúp, hỏng, rời trang. Quên một
  // đường thôi là đèn camera vẫn sáng sau khi cúp — người dùng tưởng bị quay lén.
  const cleanup = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    pc.current?.getSenders().forEach((s) => s.track?.stop());
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = null;
    try {
      pc.current?.close();
    } catch {
      // Đã đóng rồi thì thôi.
    }
    pc.current = null;
    pendingIce.current = [];
    incomingOffer.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setPeerName(null);
    setMicOn(true);
    setCamOn(true);
  }, []);

  const fail = useCallback(
    (message: string) => {
      cleanup();
      setError(message);
      setState("failed");
    },
    [cleanup],
  );

  const hangup = useCallback(() => {
    send({ type: "HANGUP" });
    cleanup();
    setError(null);
    setState("idle");
  }, [cleanup, send]);

  // ---- dựng RTCPeerConnection ----
  const buildPeer = useCallback(
    async (video: boolean) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });
      local.current = stream;
      setLocalStream(stream);

      const peer = new RTCPeerConnection({ iceServers: iceServers.current });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.ontrack = (e) => setRemoteStream(e.streams[0] ?? null);

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          send({ type: "ICE", payload: JSON.stringify(e.candidate) });
        }
      };

      peer.onconnectionstatechange = () => {
        const s = peer.connectionState;
        if (s === "connected") {
          if (timeoutId.current) clearTimeout(timeoutId.current);
          setState("active");
        } else if (s === "failed") {
          // Đây chính là cảnh thiếu TURN gây ra. Nói thẳng nguyên nhân thay vì
          // "đã xảy ra lỗi", để người dùng biết đổi sang wifi là xong.
          fail(
            hasTurn
              ? "Mất kết nối với người kia."
              : "Không nối được cuộc gọi. Hai máy đang ở hai mạng không tự thấy nhau — thử chuyển sang wifi thay vì 4G.",
          );
        }
      };

      pc.current = peer;
      return peer;
    },
    [fail, hasTurn, send],
  );

  /**
   * Nạp ứng viên ICE đã xếp hàng.
   *
   * <p>ICE thường tới TRƯỚC khi ta kịp đặt remote description, vì hai gói đi
   * độc lập. Gọi addIceCandidate lúc đó sẽ ném lỗi và ứng viên đó mất luôn —
   * mất đủ nhiều thì không tìm ra đường nối, và cuộc gọi hỏng mà không có
   * thông báo nào. Nên xếp hàng rồi nạp sau.
   */
  const drainIce = useCallback(async (peer: RTCPeerConnection) => {
    const queued = pendingIce.current;
    pendingIce.current = [];
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // Một ứng viên hỏng không làm chết cả cuộc gọi.
      }
    }
  }, []);

  /**
   * Đặt đồng hồ bỏ cuộc.
   *
   * <p>Phải gọi NGAY khi bắt đầu, trước cả getUserMedia. Trước đây nó chỉ được
   * đặt sau khi đã gửi OFFER, nên mọi thứ treo trước đó đều không có gì canh —
   * và thứ hay treo nhất chính là hộp xin quyền micro/camera mà người dùng
   * chưa bấm: getUserMedia không resolve, không reject, đứng im vô hạn. Bắt
   * được trên production: màn hình ghi "Đang gọi…" suốt hơn mười phút, không
   * một lời giải thích, trong khi quyền micro của trang vẫn ở trạng thái
   * "prompt".
   */
  const armTimeout = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      // Báo cho phía kia biết ta bỏ cuộc, nếu không máy họ reo mãi dù đầu này
      // đã tắt. fail() chỉ dọn phía mình.
      send({ type: "HANGUP" });

      // Chưa có luồng nào nghĩa là getUserMedia còn đang treo. Gần như luôn là
      // hộp xin quyền chưa ai bấm — nói đúng việc cần làm thay vì đổ cho người
      // kia không bắt máy, vì cuộc gọi còn chưa hề đi khỏi máy này.
      if (!local.current) {
        fail(
          "Trình duyệt đang chờ bạn cho phép dùng micro/camera. Bấm \"Cho phép\" ở hộp thoại trên thanh địa chỉ rồi gọi lại.",
        );
        return;
      }

      fail(
        hasTurn
          ? "Người kia không bắt máy."
          : "Không nối được cuộc gọi. Nếu đang dùng 4G, thử chuyển sang wifi.",
      );
    }, CONNECT_TIMEOUT_MS);
  }, [fail, hasTurn, send]);

  // ---- gọi đi ----
  const start = useCallback(
    async (video: boolean) => {
      if (!bookingId || state !== "idle") return;
      setError(null);
      setWithVideo(video);
      setState("calling");
      // Đặt trước buildPeer: xem chú thích ở armTimeout.
      armTimeout();
      try {
        const peer = await buildPeer(video);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        send({ type: "OFFER", payload: JSON.stringify(offer), video });
        armTimeout();
      } catch (e) {
        fail(mediaError(e));
      }
    },
    [armTimeout, bookingId, buildPeer, fail, send, state],
  );

  // ---- nhận máy ----
  const accept = useCallback(async () => {
    if (state !== "incoming" || !incomingOffer.current) return;
    setState("connecting");
    armTimeout();
    try {
      const peer = await buildPeer(withVideo);
      await peer.setRemoteDescription(
        JSON.parse(incomingOffer.current) as RTCSessionDescriptionInit,
      );
      await drainIce(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      send({ type: "ANSWER", payload: JSON.stringify(answer) });
      armTimeout();
    } catch (e) {
      fail(mediaError(e));
    }
  }, [armTimeout, buildPeer, drainIce, fail, send, state, withVideo]);

  const toggleMic = useCallback(() => {
    const track = local.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const track = local.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  // ---- lấy danh sách ICE server ----
  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    void getIceConfig()
      .then((cfg) => {
        if (cancelled) return;
        iceServers.current = cfg.iceServers ?? [];
        setHasTurn(Boolean(cfg.hasTurn));
      })
      .catch(() => {
        // Không lấy được thì vẫn thử với STUN công cộng còn hơn không gọi được.
        iceServers.current = [{ urls: ["stun:stun.l.google.com:19302"] }];
        setHasTurn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ---- nghe tín hiệu ----
  useEffect(() => {
    if (!bookingId) return;

    const off = subscribeDestination<Signal>(CALL_QUEUE, (signal) => {
      // Hàng đợi là của cả người dùng chứ không riêng buổi này: họ có thể mở
      // hai buổi ở hai tab. Không lọc thì chuông của buổi A reo ở màn buổi B.
      if (!signal || (signal.bookingId && signal.bookingId !== bookingId)) {
        return;
      }
      void handle(signal);
    });

    async function handle(signal: Signal) {
      switch (signal.type) {
        case "OFFER": {
          // Đang bận thì báo bận, đừng để chuông của mình ghi đè cuộc đang nói.
          if (state !== "idle") {
            send({ type: "BUSY" });
            return;
          }
          incomingOffer.current = signal.payload ?? null;
          setPeerName(signal.fromName ?? "Người kia");
          setWithVideo(Boolean(signal.video));
          setState("incoming");
          send({ type: "RINGING" });
          break;
        }
        case "ANSWER": {
          const peer = pc.current;
          if (!peer || !signal.payload) return;
          await peer.setRemoteDescription(
            JSON.parse(signal.payload) as RTCSessionDescriptionInit,
          );
          await drainIce(peer);
          setState("connecting");
          break;
        }
        case "ICE": {
          if (!signal.payload) return;
          const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;
          const peer = pc.current;
          if (peer?.remoteDescription) {
            try {
              await peer.addIceCandidate(candidate);
            } catch {
              // bỏ qua ứng viên hỏng
            }
          } else {
            pendingIce.current.push(candidate);
          }
          break;
        }
        case "BUSY": {
          fail("Người kia đang bận.");
          break;
        }
        case "HANGUP": {
          cleanup();
          setError(null);
          setState("idle");
          break;
        }
        case "RINGING":
        default:
          break;
      }
    }

    return off;
  }, [bookingId, cleanup, drainIce, fail, send, state]);

  // Rời trang giữa cuộc gọi vẫn phải tắt camera và báo cho phía kia.
  useEffect(() => cleanup, [cleanup]);

  return {
    state,
    peerName,
    withVideo,
    localStream,
    remoteStream,
    error,
    hasTurn,
    micOn,
    camOn,
    start,
    accept,
    hangup,
    toggleMic,
    toggleCam,
  };
}

/** Lỗi quyền camera/mic là lỗi người dùng sửa được — nói cho họ cách sửa. */
function mediaError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError") {
    return "Bạn chưa cho phép dùng micro/camera. Bấm vào biểu tượng ổ khoá trên thanh địa chỉ để cấp quyền.";
  }
  if (name === "NotFoundError") {
    return "Không tìm thấy micro hoặc camera trên máy này.";
  }
  if (name === "NotReadableError") {
    return "Micro/camera đang bị ứng dụng khác chiếm. Đóng Zoom, Meet… rồi thử lại.";
  }
  return "Không bắt đầu được cuộc gọi.";
}
