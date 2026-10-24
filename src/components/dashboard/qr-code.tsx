"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders `value` as a QR image for in-person payments. */
export function QrCode({ value, size = 180, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2, // rendered at 2x so it stays sharp on retina displays
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F172AFF", light: "#FFFFFFFF" },
    })
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={className}
        role="img"
        aria-label="QR code unavailable"
      >
        <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-center text-[12px] text-slate-500">
          Could not render a QR code for this link
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className ?? ""}`}
    >
      {src && <img src={src} alt={`QR code for ${value}`} width={size} height={size} className="h-full w-full" />}
    </div>
  );
}
