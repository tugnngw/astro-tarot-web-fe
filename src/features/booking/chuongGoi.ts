/**
 * Chuông reo khi có cuộc gọi tới.
 *
 * Không nhúng file nhạc: hai tần số 440 Hz và 480 Hz là tiếng đổ chuông điện
 * thoại thông dụng, phát hai nhịp rồi nghỉ, lặp lại cho tới khi người dùng
 * nghe máy hoặc từ chối.
 *
 * Trình duyệt không cho tự phát tiếng trước khi người dùng chạm trang. Nếu
 * cuộc gọi tới lúc màn hình đang im, chuông chờ cú chạm kế tiếp rồi mới reo.
 */
export function batDauChuong(): () => void {
  if (typeof window === "undefined") return () => {};
  const Nha = window.AudioContext;
  if (!Nha) return () => {};

  const may = new Nha();
  let dung = false;
  let daReo = false;
  let dangMo = false;
  let hen = 0;

  const motHoi = () => {
    if (dung || may.state !== "running") return;
    reo(may, 0);
    reo(may, 0.55);
    hen = window.setTimeout(motHoi, 2800);
  };

  const bat = () => {
    if (dung || daReo || dangMo) return;
    dangMo = true;
    void may
      .resume()
      .then(() => {
        dangMo = false;
        if (dung || daReo || may.state !== "running") return;
        daReo = true;
        window.removeEventListener("pointerdown", bat);
        window.removeEventListener("keydown", bat);
        motHoi();
      })
      .catch(() => {
        dangMo = false;
      });
  };

  bat();
  window.addEventListener("pointerdown", bat);
  window.addEventListener("keydown", bat);

  return () => {
    dung = true;
    window.clearTimeout(hen);
    window.removeEventListener("pointerdown", bat);
    window.removeEventListener("keydown", bat);
    void may.close().catch(() => {
      /* máy đã đóng */
    });
  };
}

/** Một nhịp chuông, tắt dần ở hai đầu để không có tiếng tách. */
function reo(may: AudioContext, tre: number) {
  const goc = may.currentTime + tre;
  const am = may.createGain();
  am.gain.setValueAtTime(0, goc);
  am.gain.linearRampToValueAtTime(0.15, goc + 0.02);
  am.gain.setValueAtTime(0.15, goc + 0.38);
  am.gain.linearRampToValueAtTime(0, goc + 0.42);
  am.connect(may.destination);

  for (const hz of [440, 480]) {
    const song = may.createOscillator();
    song.type = "sine";
    song.frequency.value = hz;
    song.connect(am);
    song.start(goc);
    song.stop(goc + 0.45);
  }
}
