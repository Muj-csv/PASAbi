/**
 * QR in the browser (ADR-008 / ADR-009): draw with `qrcode`, read with the
 * camera + `jsqr`. Both run fully offline, and jsQR needs no BarcodeDetector,
 * which iOS Safari does not have.
 */
import jsQR from "jsqr";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef } from "react";

/**
 * A QR as one SVG path. Level M, the level the Expo app measured D-027's
 * 500-character frames at. The 4-module quiet zone is part of the viewBox.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const { size, d } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let path = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { size: n, d: path };
  }, [value]);
  return (
    <svg className="qr" viewBox={`-4 -4 ${size + 8} ${size + 8}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect x={-4} y={-4} width={size + 8} height={size + 8} fill="var(--paper)" />
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export type CameraState = "starting" | "on" | "denied";

/**
 * Rear camera → canvas → jsQR, about 8 times a second. Every decoded string
 * goes to onCode; callers dedupe (the BundleAssembler ignores repeats).
 * `onIdle` fires every 3 s without a read, for the rotating tips.
 */
export function QrScanner({
  onCode,
  onIdle,
  onState,
}: {
  onCode: (text: string) => void;
  onIdle?: () => void;
  onState?: (s: CameraState) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const handlers = useRef({ onCode, onIdle, onState });
  useEffect(() => {
    handlers.current = { onCode, onIdle, onState };
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    let lastRead = Date.now();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const v = video.current;
      if (v && ctx && v.readyState >= 2 && v.videoWidth > 0) {
        const scale = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          lastRead = Date.now();
          handlers.current.onCode(code.data);
        } else if (Date.now() - lastRead > 3000) {
          lastRead = Date.now();
          handlers.current.onIdle?.();
        }
      }
      timer = window.setTimeout(tick, 120);
    };

    const cleanup = () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };

    // No camera API at all: an insecure (http) context, or a very old iOS.
    if (!navigator.mediaDevices?.getUserMedia) {
      handlers.current.onState?.("denied");
      return cleanup;
    }

    handlers.current.onState?.("starting");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((tr) => tr.stop());
          return;
        }
        stream = s;
        const v = video.current;
        if (v) {
          v.srcObject = s;
          void v.play();
        }
        handlers.current.onState?.("on");
        tick();
      })
      .catch(() => handlers.current.onState?.("denied"));

    return cleanup;
  }, []);

  // Callers remount this (a new `key`) to retry after "Camera is off".
  return (
    <div className="camera">
      <video ref={video} playsInline muted autoPlay />
      <div className="aim" aria-hidden="true" />
    </div>
  );
}

/** Keep the screen on while a QR is showing (where the browser allows it). */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const acquire = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (released) void l.release();
          else lock = l;
        })
        .catch(() => undefined);
    void acquire();
    const again = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", again);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", again);
      void lock?.release();
    };
  }, [active]);
}
