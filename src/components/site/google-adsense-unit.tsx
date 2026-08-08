"use client";
import { useEffect, useRef } from "react";
type AdsByGoogleWindow = Window & {
  adsbygoogle?: Array<Record<string, unknown>>;
};
type GoogleAdSenseUnitProps = {
  client: string | null | undefined;
  slot: string | null | undefined;
  format?: string;
  responsive?: boolean;
  className?: string;
};
export function GoogleAdSenseUnit({
  client,
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: GoogleAdSenseUnitProps) {
  const initialized = useRef(false);
  const normalizedClient = client?.trim() ?? "";
  const normalizedSlot = slot?.trim() ?? "";
  const configured =
    /^ca-pub-\d{16}$/.test(normalizedClient) && /^\d+$/.test(normalizedSlot);
  useEffect(() => {
    if (!configured || initialized.current) {
      return;
    }
    try {
      const adsenseWindow = window as AdsByGoogleWindow;
      adsenseWindow.adsbygoogle = adsenseWindow.adsbygoogle ?? [];
      adsenseWindow.adsbygoogle.push({});
      initialized.current = true;
    } catch {
      initialized.current = false;
    }
  }, [configured, normalizedClient, normalizedSlot]);
  if (!configured) {
    return null;
  }
  return (
    <ins
      className={`adsbygoogle block ${className}`.trim()}
      style={{
        display: "block",
      }}
      data-ad-client={normalizedClient}
      data-ad-slot={normalizedSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
