"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, X, Megaphone } from "lucide-react";

export interface ZeroClickSignal {
  category:
    | "interest"
    | "evaluation"
    | "problem"
    | "purchase_intent"
    | "price_sensitivity"
    | "brand_affinity"
    | "user_context"
    | "business_context"
    | "recommendation_request";
  confidence: number;
  subject: string;
  relatedSubjects?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  iab?: { type: string; version: string; ids: string[] };
}

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
  /** IAB-compatible signals extracted from the pipeline brief for better targeting */
  signals?: ZeroClickSignal[];
  /** Called when an ad offer is successfully loaded and will be displayed */
  onAdServed?: (offer: ZeroClickOffer) => void;
}

type AdStatus = "idle" | "loading" | "loaded" | "empty";

function getSessionId(): string {
  try {
    const key = "zc_session_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function ZeroClickAd({ query, muted, signals, onAdServed }: ZeroClickAdProps) {
  const [status, setStatus] = useState<AdStatus>("idle");
  const [offer, setOffer] = useState<ZeroClickOffer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tracked, setTracked] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // Fetch contextually matched offer whenever query changes
  useEffect(() => {
    if (muted || !query.trim()) return;

    setStatus("loading");
    setOffer(null);
    setDismissed(false);
    setVisible(false);
    setTracked(false);

    const controller = new AbortController();
    const sessionId = getSessionId();
    const locale =
      typeof navigator !== "undefined" ? navigator.language ?? "en-US" : "en-US";

    fetch("/api/ads/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        sessionId,
        locale,
        signals: signals ?? [],
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok || res.status === 204) return null;
        return res.json() as Promise<ZeroClickOffer>;
      })
      .then((data) => {
        if (data?.id) {
          setOffer(data);
          setStatus("loaded");
          onAdServed?.(data);
        } else {
          setStatus("empty");
        }
      })
      .catch(() => {
        setStatus("empty");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, muted]);

  // Trigger fade-in one frame after offer is set
  useEffect(() => {
    if (status === "loaded" && offer) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [status, offer]);

  // IntersectionObserver: track impression only when 50%+ visible in viewport
  useEffect(() => {
    if (!offer || tracked || dismissed || muted) return;

    const el = adRef.current;
    if (!el) return;

    function trackImpression() {
      if (!offer) return;
      setTracked(true);
      fetch("https://zeroclick.dev/api/v2/impressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [offer.id] }),
      }).catch(() => {});
    }

    if (typeof IntersectionObserver === "undefined") {
      trackImpression();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackImpression();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [offer, tracked, dismissed, muted]);

  // Loading skeleton — subtle shimmer while fetching
  if (!muted && status === "loading") {
    return (
      <div
        className="mt-5 animate-pulse rounded-xl p-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: "var(--gray-200)" }} />
          <div className="h-2 w-16 rounded" style={{ background: "var(--gray-200)" }} />
        </div>
        <div className="h-3 w-3/4 rounded" style={{ background: "var(--gray-200)" }} />
        <div className="mt-1.5 h-2.5 w-full rounded" style={{ background: "var(--gray-100)" }} />
        <div className="mt-1 h-2.5 w-4/5 rounded" style={{ background: "var(--gray-100)" }} />
        <div className="mt-3 h-7 w-20 rounded-lg" style={{ background: "var(--gray-200)" }} />
      </div>
    );
  }

  if (muted || !offer || dismissed || status !== "loaded") return null;

  return (
    <div
      ref={adRef}
      className="mt-5 rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 400ms ease, transform 400ms ease",
      }}
    >
      {/* Header: Sponsored pill + brand + dismiss */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Megaphone size={9} style={{ color: "var(--gray-400)" }} />
            <span
              className="font-mono text-[8px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--gray-400)" }}
            >
              Sponsored
            </span>
          </span>
          {offer.brand?.name && (
            offer.brand.url ? (
              <a
                href={offer.brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] transition-opacity hover:opacity-70"
                style={{ color: "var(--gray-500)" }}
              >
                {offer.brand.name}
              </a>
            ) : (
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-500)" }}>
                {offer.brand.name}
              </span>
            )
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-0.5 transition-opacity hover:opacity-60"
          style={{ color: "var(--gray-400)" }}
          aria-label="Dismiss ad"
        >
          <X size={12} />
        </button>
      </div>

      {/* Ad body */}
      <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--gray-700)" }}>
        {offer.title}
      </p>

      {offer.subtitle && (
        <p className="mt-0.5 text-[12px]" style={{ color: "var(--gray-500)" }}>
          {offer.subtitle}
        </p>
      )}

      {offer.content && (
        <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          {offer.content.length > 160 ? offer.content.slice(0, 160) + "…" : offer.content}
        </p>
      )}

      {/* CTA */}
      {offer.cta && offer.clickUrl && (
        <a
          href={offer.clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            color: "var(--green-400)",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34, 197, 94, 0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34, 197, 94, 0.08)";
          }}
        >
          {offer.cta}
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
