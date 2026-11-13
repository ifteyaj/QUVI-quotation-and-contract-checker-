"use client";

import { useEffect, useRef, useState } from "react";

// The /dashboard/preview route renders at this fixed size so the desktop
// dashboard layout is preserved inside the frame, then scales to fit.
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 800;
const FRAME_PADDING = 8; // p-2 bezel around the preview

/**
 * Scaled preview of the real QUVI dashboard (rendered by /dashboard/preview
 * in an iframe) inside a Launch-UI-style mockup frame. The bottom of the
 * dashboard is intentionally cropped, matching the reference hero layout.
 */
export function DashboardPreviewFrame() {
  const cropWindowRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const cropWindow = cropWindowRef.current;

    if (!cropWindow) {
      return;
    }

    const updateScale = () => {
      const innerWidth = cropWindow.clientWidth - FRAME_PADDING * 2;
      setScale(innerWidth / CANVAS_WIDTH);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(cropWindow);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cropWindowRef}
      className="relative aspect-[16/7] w-full overflow-hidden"
    >
      <div
        className="absolute left-0 top-0 w-full rounded-2xl bg-gradient-to-b from-border/80 to-border/30 p-2 shadow-[0_32px_80px_-24px_rgba(37,99,235,0.28)] ring-1 ring-foreground/5"
        style={{
          height: scale > 0 ? CANVAS_HEIGHT * scale + FRAME_PADDING * 2 : undefined,
        }}
      >
        <div
          className="relative w-full overflow-hidden rounded-xl bg-card"
          style={{ height: scale > 0 ? CANVAS_HEIGHT * scale : undefined }}
        >
          <iframe
            src="/dashboard/preview"
            title="QUVI dashboard preview"
            role="img"
            aria-label="Preview of the QUVI dashboard showing verification summary cards, recent quotations, and decision statuses"
            tabIndex={-1}
            loading="eager"
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: scale > 0 ? `scale(${scale})` : undefined,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
