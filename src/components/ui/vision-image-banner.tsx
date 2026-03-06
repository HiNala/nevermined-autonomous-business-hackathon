"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

export interface VisionResult {
  imageUrl: string;
  attempts: number;
  passedQuality: boolean;
  qualityScore: number;
  finalPrompt: string;
}

export function VisionImageBanner({
  visionResult,
  title,
}: {
  visionResult: VisionResult;
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expanded]);

  return (
    <>
      <div
        className="mb-5 overflow-hidden rounded-xl cursor-pointer group"
        style={{ border: "1px solid var(--border-default)" }}
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
        aria-label={`View generated image for ${title}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(true); }}
      >
        <div className="relative overflow-hidden">
          <img
            src={visionResult.imageUrl}
            alt={title || "VISION generated image"}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ maxHeight: "220px" }}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <span
              className="font-mono text-[10px] font-bold text-white rounded-full px-3 py-1.5"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              Click to expand
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-default)" }}
        >
          <span
            className="flex items-center gap-1.5 font-mono text-[8px] font-semibold rounded-full px-2 py-0.5"
            style={{
              background: visionResult.passedQuality ? "rgba(34,197,94,0.10)" : "rgba(234,179,8,0.10)",
              color: visionResult.passedQuality ? "#22C55E" : "#CA8A04",
              border: `1px solid ${visionResult.passedQuality ? "rgba(34,197,94,0.22)" : "rgba(234,179,8,0.22)"}`,
            }}
          >
            <ImageIcon size={9} />
            VISION · NanoBanana · {visionResult.attempts} attempt{visionResult.attempts !== 1 ? "s" : ""} · {visionResult.qualityScore}/100
          </span>
          {visionResult.passedQuality && (
            <span className="font-mono text-[8px]" style={{ color: "#22C55E" }}>✓ quality passed</span>
          )}
          <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>click to expand</span>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={visionResult.imageUrl}
              alt={title || "VISION generated image"}
              className="w-full object-contain rounded-t-2xl"
              style={{ maxHeight: "60vh" }}
            />
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-b-2xl"
              style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-default)" }}
            >
              <ImageIcon size={12} style={{ color: "#CA8A04" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--gray-700)" }}>{title}</p>
                <p className="font-mono text-[9px] truncate" style={{ color: "var(--gray-400)" }}>{visionResult.finalPrompt}</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="shrink-0 rounded-lg px-3 py-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
                aria-label="Close lightbox"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
