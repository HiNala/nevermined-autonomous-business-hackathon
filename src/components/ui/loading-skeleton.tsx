"use client";

import { useState, useEffect } from "react";
import { Bot, Package, Sparkles, Search, Loader2, RotateCcw } from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";
import type { PipelineEvent } from "@/types/pipeline";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";

const STAGE_LABELS: Record<string, string> = {
  strategist_working: "Strategist is analyzing your input…",
  strategist_complete: "Brief structured — handing off to Researcher…",
  researcher_buying: "Researcher purchasing brief from Strategist…",
  researcher_working: "Researcher searching and scraping the web…",
  researcher_evaluating: "Evaluating document completeness…",
  researcher_followup: "Requesting additional context…",
  buyer_discovering: "Buyer scanning the marketplace for assets…",
  buyer_purchasing: "Buyer purchasing marketplace assets…",
  buyer_complete: "Marketplace procurement complete",
  seller_received: "Seller received an external order…",
  seller_planning: "Seller planning fulfillment strategy…",
  seller_fulfilling: "Seller dispatching to internal pipeline…",
  seller_complete: "Seller order fulfilled and delivered",
  vision_complete: "VISION agent generated image via NanoBanana",
};

function getLoadingWords(mode: ViewMode, stage?: string, agent?: string): string[] {
  if (mode === "seller" || agent === "seller") {
    if (stage === "seller_received") return ["receive", "route", "deliver"];
    if (stage === "seller_planning") return ["match", "price", "plan"];
    if (stage === "seller_fulfilling") return ["dispatch", "merge", "deliver"];
    return ["route", "package", "deliver"];
  }
  if (mode === "strategist" || agent === "strategist") return ["review", "scope", "plan"];
  if (mode === "researcher" || agent === "researcher") {
    if (stage === "researcher_evaluating") return ["review", "score", "refine"];
    if (stage === "researcher_followup") return ["question", "expand", "retry"];
    return ["search", "sift", "compose"];
  }
  if (stage === "buyer_discovering" || stage === "buyer_purchasing" || agent === "buyer") {
    return ["scan", "price", "buy"];
  }
  return ["review", "plan", "act"];
}

function getLoadingHints(mode: ViewMode, stage?: string, agent?: string): string[] {
  if (mode === "seller" || agent === "seller") {
    if (stage === "seller_planning") return ["matching the best product", "checking if outside data is worth it", "preparing the fulfillment path"];
    if (stage === "seller_fulfilling") return ["dispatching work to the right agents", "assembling the delivery package", "tracking fulfillment across the pipeline"];
    return ["receiving the order", "setting the commercial boundary", "preparing final delivery"];
  }
  if (mode === "strategist" || agent === "strategist") {
    return ["tightening the brief", "expanding vague intent into scope", "turning your request into an execution plan"];
  }
  if (mode === "researcher" || agent === "researcher") {
    if (stage === "researcher_evaluating") return ["checking for coverage gaps", "testing whether the report is complete", "deciding if another pass is needed"];
    if (stage === "researcher_followup") return ["asking for sharper context", "opening a second pass", "resolving missing detail"];
    return ["checking sources", "weighing signals", "shaping the report"];
  }
  if (stage === "buyer_discovering" || stage === "buyer_purchasing" || agent === "buyer") {
    return ["searching marketplace options", "comparing asset value", "pulling in outside context"];
  }
  return ["coordinating agents", "moving work through the chain", "turning intent into output"];
}

function TypingStatusWords({ words, color }: { words: string[]; color: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex] ?? "";
    const isWordComplete = charIndex === currentWord.length;
    const isWordCleared = charIndex === 0;
    const delay = isDeleting ? 45 : isWordComplete ? 900 : 85;

    const timer = window.setTimeout(() => {
      if (!isDeleting && !isWordComplete) { setCharIndex((v) => v + 1); return; }
      if (!isDeleting && isWordComplete) { setIsDeleting(true); return; }
      if (isDeleting && !isWordCleared) { setCharIndex((v) => v - 1); return; }
      setIsDeleting(false);
      setWordIndex((v) => (v + 1) % words.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex, words]);

  const visibleWord = (words[wordIndex] ?? "").slice(0, charIndex);

  return (
    <div
      className="mb-2 inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ color, background: `${color}10`, border: `1px solid ${color}20` }}
      aria-live="polite"
    >
      <span>{visibleWord || "\u00A0"}</span>
      <span className="ml-1 inline-block h-3 w-px animate-pulse" style={{ background: color }} aria-hidden="true" />
    </div>
  );
}

function LoadingPulseDots({ color }: { color: string }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full animate-pulse"
          style={{ background: color, opacity: 0.35 + index * 0.18, animationDelay: `${index * 180}ms` }}
        />
      ))}
    </div>
  );
}

function LoadingMicroHint({ hints, color }: { hints: string[]; color: string }) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (hints.length <= 1) return;
    const timer = window.setInterval(() => setHintIndex((v) => (v + 1) % hints.length), 1800);
    return () => window.clearInterval(timer);
  }, [hints]);

  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-[10px]">
      <span className="rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.18em]" style={{ color, background: `${color}08`, border: `1px solid ${color}18` }}>
        live
      </span>
      <span className="transition-opacity duration-300" style={{ color: "var(--gray-400)" }}>
        {hints[hintIndex]}
      </span>
    </div>
  );
}

export function LoadingSkeleton({
  mode,
  events,
  elapsed,
  onCancel,
}: {
  mode: ViewMode;
  events: PipelineEvent[];
  elapsed?: number;
  onCancel?: () => void;
}) {
  const lastEvent = events[events.length - 1];
  const currentLabel = lastEvent ? (STAGE_LABELS[lastEvent.stage] ?? lastEvent.message) : "Initializing pipeline…";
  const agentWorking = lastEvent?.agent ?? "pipeline";
  const color = AGENT_CONFIG[agentWorking as keyof typeof AGENT_CONFIG]?.color ?? "var(--green-400)";
  const typingWords = getLoadingWords(mode, lastEvent?.stage, agentWorking);
  const loadingHints = getLoadingHints(mode, lastEvent?.stage, agentWorking);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl p-8"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ background: `${color}15` }}>
          <div className="h-full w-[40%] rounded-full" style={{ background: color, animation: "progress-indeterminate 1.8s ease-in-out infinite" }} />
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative flex size-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }} />
            <div className="absolute inset-0 animate-pulse rounded-2xl" style={{ background: `${color}05` }} />
            {mode === "pipeline" ? (
              <Bot size={26} style={{ color }} />
            ) : mode === "seller" ? (
              <Package size={26} style={{ color }} />
            ) : agentWorking === "strategist" ? (
              <Sparkles size={26} style={{ color }} />
            ) : (
              <Search size={26} style={{ color }} />
            )}
          </div>

          <div>
            <TypingStatusWords words={typingWords} color={color} />
            <p className="mb-1.5 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>
              {mode === "pipeline" ? "Pipeline Running" : mode === "seller" ? "Seller Fulfilling" : agentWorking === "strategist" ? "Strategist Working" : "Researcher Working"}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{currentLabel}</p>
            <LoadingPulseDots color={color} />
            <LoadingMicroHint hints={loadingHints} color={color} />
          </div>

          {events.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {events.map((evt, i) => {
                const stageColor = AGENT_CONFIG[evt.agent as keyof typeof AGENT_CONFIG]?.color ?? color;
                return (
                  <span
                    key={evt.id}
                    className="rounded-md px-2 py-0.5 font-mono text-[8px] font-semibold transition-all animate-fade-in"
                    style={{
                      background: i === events.length - 1 ? `${stageColor}15` : "var(--bg-surface)",
                      border: `1px solid ${i === events.length - 1 ? `${stageColor}30` : "var(--border-default)"}`,
                      color: i === events.length - 1 ? stageColor : "var(--gray-400)",
                    }}
                  >
                    {evt.agent}
                  </span>
                );
              })}
              <span className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                <Loader2 size={8} className="animate-spin" />
              </span>
            </div>
          )}

          <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
            {elapsed != null && elapsed > 0 ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed · ` : ""}
            {mode === "pipeline" ? "Usually 3–7 min" : mode === "seller" ? "Usually 3–5 min" : mode === "researcher" ? "Usually 1–3 min" : "Usually 30–60 sec"}
            {events.length > 0 && ` · ${events.length} stage${events.length !== 1 ? "s" : ""} complete`}
          </p>
        </div>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono text-[11px] transition-all hover:opacity-80"
          style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#EF4444" }}
        >
          <RotateCcw size={11} /> Cancel
        </button>
      )}
    </div>
  );
}
