"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function TloraPublicPreviewLoader() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.parent === window) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void import("./tlora-public-preview-bridge").then((bridge) => {
      if (cancelled) return;
      stop = bridge.startTloraPublicPreviewBridge();
      bridge.notifyTloraPublicPreviewPathname(window.location.pathname);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  useEffect(() => {
    if (window.parent === window) return;
    void import("./tlora-public-preview-bridge").then((bridge) => {
      bridge.notifyTloraPublicPreviewPathname(pathname);
    });
  }, [pathname]);

  return null;
}
