// Khung cuộc gọi: chuông đến, video hai bên, nút tắt mic/cam, cúp máy.
import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, TriangleAlert } from "lucide-react";
import { LopPhu } from "@/components/GocNoi";
import type { BookingCall } from "../hooks/useBookingCall";

/** Gắn MediaStream vào thẻ video. */
function useStream(ref: React.RefObject<HTMLVideoElement | null>, stream: MediaStream | null) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Gán trực tiếp chứ không qua thuộc tính src: MediaStream không phải URL.
    el.srcObject = stream;
    if (stream) void el.play().catch(() => {
      // Trình duyệt chặn tự phát khi chưa có tương tác — người dùng bấm là chạy.
    });
  }, [ref, stream]);
}

export function CallPanel({ call }: { call: BookingCall }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useStream(localRef, call.localStream);
  useStream(remoteRef, call.remoteStream);

  if (call.state === "idle" && !call.error) {
    // Chỉ cảnh báo thiếu TURN, không chiếm chỗ khi mọi thứ bình thường.
    if (call.hasTurn) return null;
    return (
      <p className="flex items-start gap-2 border-b border-amber-400/20 bg-amber-950/40 px-4 py-2 text-[11px] text-amber-100">
        <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Cuộc gọi nối thẳng giữa hai máy. Không nối được thì nhắn tin vẫn
        dùng được.
      </p>
    );
  }

  if (call.state === "failed") {
    return (
      <div className="flex items-start justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-foreground">
        <span>{call.error}</span>
        <button
          type="button"
          onClick={call.hangup}
          className="shrink-0 rounded-lg border border-white/15 px-2 py-1"
        >
          Đóng
        </button>
      </div>
    );
  }

  if (call.state === "incoming") {
    const ten = call.peerName || "Người kia";
    return (
      <LopPhu>
      <div className="fixed inset-0 z-[200] grid place-items-center bg-black/65 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${ten} đang gọi`}
          className="w-full max-w-sm rounded-3xl bg-[#242526] px-6 py-8 text-center text-white shadow-2xl"
        >
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#3a3b3c] text-3xl font-semibold">
            {ten.charAt(0).toUpperCase()}
          </div>
          <p className="mt-4 text-xl font-semibold">{ten}</p>
          <p className="mt-1 text-sm text-white/70">
            Đang gọi {call.withVideo ? "video" : "thoại"} cho bạn
          </p>
          <div className="mt-8 flex items-center justify-center gap-16">
            <button
              type="button"
              onClick={call.hangup}
              className="grid h-16 w-16 place-items-center rounded-full bg-[#e41e3f] text-white"
            >
              <PhoneOff aria-hidden className="h-7 w-7" />
              <span className="sr-only">Từ chối</span>
            </button>
            <button
              type="button"
              onClick={() => void call.accept()}
              className="grid h-16 w-16 place-items-center rounded-full bg-[#31a24c] text-white"
            >
              {call.withVideo ? (
                <Video aria-hidden className="h-7 w-7" />
              ) : (
                <Phone aria-hidden className="h-7 w-7" />
              )}
              <span className="sr-only">Nghe</span>
            </button>
          </div>
        </div>
      </div>
      </LopPhu>
    );
  }

  const dangNoi = call.state === "active";

  return (
    <div className="border-b border-white/5 bg-black/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {call.state === "calling" && "Đang gọi…"}
          {call.state === "connecting" && "Đang kết nối…"}
          {dangNoi && "Đang trong cuộc gọi"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={call.toggleMic}
            title={call.micOn ? "Tắt micro" : "Bật micro"}
            className="rounded-full border border-white/15 p-2"
          >
            {call.micOn ? (
              <Mic aria-hidden className="h-4 w-4" />
            ) : (
              <MicOff aria-hidden className="h-4 w-4 text-destructive" />
            )}
            <span className="sr-only">{call.micOn ? "Tắt micro" : "Bật micro"}</span>
          </button>
          {call.withVideo && (
            <button
              type="button"
              onClick={call.toggleCam}
              title={call.camOn ? "Tắt camera" : "Bật camera"}
              className="rounded-full border border-white/15 p-2"
            >
              {call.camOn ? (
                <Video aria-hidden className="h-4 w-4" />
              ) : (
                <VideoOff aria-hidden className="h-4 w-4 text-destructive" />
              )}
              <span className="sr-only">
                {call.camOn ? "Tắt camera" : "Bật camera"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={call.hangup}
            title="Cúp máy"
            className="rounded-full bg-destructive p-2"
          >
            <PhoneOff aria-hidden className="h-4 w-4" />
            <span className="sr-only">Cúp máy</span>
          </button>
        </div>
      </div>

      {call.withVideo && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <video
            ref={remoteRef}
            playsInline
            autoPlay
            className="aspect-video w-full rounded-xl bg-black object-cover"
          />
          <video
            ref={localRef}
            playsInline
            autoPlay
            // Không tắt tiếng video của chính mình là vọng âm ngay lập tức.
            muted
            className="aspect-video w-full rounded-xl bg-black object-cover"
          />
        </div>
      )}

      {/* Gọi thoại vẫn cần thẻ audio, nếu không thì không ai nghe thấy ai. */}
      {!call.withVideo && (
        <video ref={remoteRef} autoPlay playsInline className="hidden" />
      )}
    </div>
  );
}
