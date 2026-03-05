"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, X, Megaphone } from "lucide-react";

export interface ZeroClickOffer {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  cta: string;
  clickUrl: string;
  imageUrl?: string;
  brand: { name: string; url: string };
  price?: { amount: string; currency: string };
}

interface ZeroClickAdProps {
  /** The research topic / query used to contextually target the ad */
  query: string;
  /** Global mute: when true, no requests are made and no ad is shown */
  muted: boolean;
}

export function ZeroClickAd({ query, muted }: ZeroClickAdProps) {
  const [offer, setOffer] = useState<ZeroClickOffer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const trackedRef = useRef(false);
  const prevQueryRef = useRef(query);

  // Fetch a contextually matched offer whenever query changes
  useEffect(() => {
    if (muted || !query.trim()) return;

    // Reset local refs on query change (avoids synchronous setState in effect)
    if (prevQueryRef.current !== query) {
      prevQueryRef.current = query;
      trackedRef.current = false;
    }

    const controller = new AbortController();

    fetch("/api/ads/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok || res.status === 204) return null;
        return res.json() as Promise<ZeroClickOffer>;
      })
      .then((data) => {
        if (data?.id) setOffer(data);
        else setOffer(null);
      })
      .catch(() => {
        // silently swallow — ads failing should never break the UI
      });

    return () => controller.abort();
  }, [query, muted]);

  // Track impression once the offer is rendered and visible
  useEffect(() => {
    if (!offer || trackedRef.current || dismissed || muted) return;

    trackedRef.current = true;

    // Impressions must be sent from the client device (ZeroClick requirement)
    fetch("https://zeroclick.dev/api/v2/impressions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [offer.id] }),
    }).catch(() => {});
  }, [offer, dismissed, muted]);

  if (muted || !offer || dismissed) return null;

  return (
    <div
      className="mt-5 rounded-xl p-4"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header: Sponsored label + brand + dismiss */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Megaphone size={10} style={{ color: "var(--gray-400)" }} />
          <span
            className="font-mono text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Sponsored
          </span>
          {offer.brand?.name && (
            <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
              &middot; {offer.brand.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-0.5 transition-opacity hover:opacity-80"
          style={{ color: "var(--gray-400)" }}
          aria-label="Dismiss ad"
        >
          <X size={12} />
        </button>
      </div>

      {/* Ad body */}
      <p
        className="text-[13px] font-semibold leading-snug"
        style={{ color: "var(--gray-700)" }}
      >
        {offer.title}
      </p>

      {offer.subtitle && (
        <p
          className="mt-0.5 text-[12px]"
          style={{ color: "var(--gray-500)" }}
        >
          {offer.subtitle}
        </p>
      )}

      {offer.content && (
        <p
          className="mt-2 text-[12px] leading-relaxed"
          style={{ color: "var(--gray-400)" }}
        >
          {offer.content.length > 140
            ? offer.content.slice(0, 140) + "…"
            : offer.content}
        </p>
      )}

      {/* CTA */}
      {offer.cta && offer.clickUrl && (
        <a
          href={offer.clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            color: "var(--green-400)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 0.14)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 0.08)";
          }}
        >
          {offer.cta}
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
