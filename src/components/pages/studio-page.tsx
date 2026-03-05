"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Nav } from "@/components/layout/nav";
import {
  Send,
  FileText,
  Globe,
  Clock,
  Zap,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Bot,
  Sparkles,
  Search,
  LayoutList,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
  Package,
  Settings,
  Download,
  Award,
} from "lucide-react";
import { ZeroClickAd, type ZeroClickSignal } from "@/components/ui/zeroclick-ad";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { loadToolSettings, saveToolSettings, type ToolSettings } from "@/lib/tool-settings";
import { PurchasedAssetGrid } from "@/components/ui/purchased-asset-card";
import { SponsorRail } from "@/components/ui/sponsor-rail";
import { JudgeMode, type JudgePreset } from "@/components/ui/judge-mode";
import type {
  ResearchSource,
  ResearchDocument,
  StructuredBrief,
  AgentTransaction,
  PipelineEvent,
  PurchasedAsset,
  PipelineResult,
  SponsorToolUsage,
} from "@/types/pipeline";
import { AGENT_CONFIG } from "@/lib/agent/config";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";
type OutputType = "research" | "prd" | "plan" | "analysis" | "general";

const OUTPUT_TYPES: { value: OutputType; label: string; icon: typeof FileText }[] = [
  { value: "research", label: "Research Report", icon: Search },
  { value: "prd", label: "PRD", icon: FileText },
  { value: "plan", label: "Strategic Plan", icon: LayoutList },
  { value: "analysis", label: "Analysis", icon: Sparkles },
  { value: "general", label: "General", icon: Globe },
];

// ─── Transaction stream hook ────────────────────────────────────────
function useTransactionStream() {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/pipeline/transactions");
    es.onmessage = (e) => {
      try {
        const tx = JSON.parse(e.data) as AgentTransaction;
        setTransactions((prev) => [...prev.slice(-49), tx]);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  return transactions;
}

// ─── Tool provider badge colors ─────────────────────────────────────
const TOOL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  apify: { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.12)" },
  exa: { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  duckduckgo: { label: "DDG", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  raw: { label: "Raw", color: "var(--gray-500)", bg: "var(--glass-bg)" },
  nevermined: { label: "NVM", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};

// ─── Agent Card ─────────────────────────────────────────────────────
function AgentCard({
  agent,
  isActive,
  isSelected,
  onClick,
  stats,
  toolLabel,
}: {
  agent: typeof AGENT_CONFIG.strategist;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  stats: { earned: number; handled: number };
  toolLabel?: string;
}) {
  const badge = toolLabel ? TOOL_BADGE[toolLabel] : null;

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200"
      style={{
        background: isSelected ? agent.bgColor : "var(--glass-bg)",
        border: `1px solid ${isSelected ? agent.borderColor : "var(--border-default)"}`,
      }}
    >
      {/* Avatar */}
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
        style={{ background: agent.bgColor, color: agent.color }}
      >
        {agent.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>
            {agent.name}
          </span>
          {badge && (
            <span
              className="rounded px-1 py-0.5 font-mono text-[7px] font-bold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          )}
          {isActive && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: agent.color }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: agent.color }} />
            </span>
          )}
          <span className="ml-auto font-mono text-[9px]" style={{ color: isActive ? agent.color : "var(--gray-400)" }}>
            {isActive ? "working" : `${stats.handled}t`}
          </span>
        </div>
        <p className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
          {agent.role}
        </p>
      </div>
    </button>
  );
}

// ─── Sponsor badge helpers for pipeline stages ──────────────────────
const STAGE_SPONSOR_HINTS: Record<string, { label: string; color: string; bg: string }> = {
  researcher_working: { label: "Web Search", color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  buyer_discovering: { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  buyer_purchasing: { label: "NVM x402", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  seller_received: { label: "NVM x402", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  seller_planning: { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
};

function inferSponsorBadge(msg: string): { label: string; color: string; bg: string } | null {
  const m = msg.toLowerCase();
  if (m.includes("apify")) return { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.10)" };
  if (m.includes("exa")) return { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.10)" };
  if (m.includes("marketplace") || m.includes("purchase") || m.includes("x402")) return { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" };
  if (m.includes("zeroclick") || m.includes("ad")) return { label: "ZeroClick", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" };
  return null;
}

// ─── Pipeline Stage Indicator ───────────────────────────────────────
function PipelineStages({ events, isRunning }: { events: PipelineEvent[]; isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const stageColors: Record<string, string> = {
    strategist_working: AGENT_CONFIG.strategist.color,
    strategist_complete: AGENT_CONFIG.strategist.color,
    researcher_buying: "#F59E0B",
    researcher_working: AGENT_CONFIG.researcher.color,
    researcher_evaluating: "#F59E0B",
    researcher_followup: "#EF4444",
    buyer_discovering: AGENT_CONFIG.buyer.color,
    buyer_purchasing: AGENT_CONFIG.buyer.color,
    buyer_complete: AGENT_CONFIG.buyer.color,
    seller_received: AGENT_CONFIG.seller.color,
    seller_planning: AGENT_CONFIG.seller.color,
    seller_fulfilling: AGENT_CONFIG.seller.color,
    seller_complete: AGENT_CONFIG.seller.color,
    complete: "var(--green-400)",
    error: "#EF4444",
  };

  if (events.length === 0 && !isRunning) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-2 flex justify-center">
            <ArrowRight size={20} style={{ color: "var(--gray-300)" }} />
          </div>
          <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
            Pipeline stages will appear here as agents work
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      {events.map((event) => {
        const stageHint = STAGE_SPONSOR_HINTS[event.stage];
        const msgHint = inferSponsorBadge(event.message);
        const badge = msgHint ?? stageHint;

        return (
          <div key={event.id} className="flex items-start gap-2.5 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
            <span
              className="mt-1 size-2 shrink-0 rounded-full"
              style={{ background: stageColors[event.stage] ?? "var(--gray-400)" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase"
                  style={{
                    background: AGENT_CONFIG[event.agent as keyof typeof AGENT_CONFIG]?.bgColor ?? "var(--glass-bg)",
                    color: AGENT_CONFIG[event.agent as keyof typeof AGENT_CONFIG]?.color ?? "var(--gray-400)",
                  }}
                >
                  {event.agent}
                </span>
                {badge && (
                  <span
                    className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                )}
                <span className="ml-auto font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
                {event.message}
              </p>
            </div>
          </div>
        );
      })}
      {isRunning && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={12} className="animate-spin" style={{ color: "var(--green-400)" }} />
          <span className="text-[11px]" style={{ color: "var(--green-400)" }}>Processing…</span>
        </div>
      )}
    </div>
  );
}

// ─── Transaction Feed ───────────────────────────────────────────────
function TransactionFeed({ transactions }: { transactions: AgentTransaction[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>No transactions yet</p>
      </div>
    );
  }

  const isMarketplace = (tx: AgentTransaction) =>
    tx.to.id === "marketplace" || tx.from.id === "external-buyer" || tx.to.name.startsWith("Marketplace:");
  const isExternal = (tx: AgentTransaction) =>
    tx.from.id === "external-buyer" || tx.to.id === "marketplace";

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      {transactions.map((tx) => {
        const marketplace = isMarketplace(tx);
        const external = isExternal(tx);
        return (
          <div
            key={tx.id}
            className="py-2 border-b"
            style={{
              borderColor: "var(--border-default)",
              background: marketplace ? "rgba(34, 197, 94, 0.02)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-semibold" style={{
                color: AGENT_CONFIG[tx.from.id as keyof typeof AGENT_CONFIG]?.color ?? (external ? "#22C55E" : "var(--gray-400)")
              }}>
                {tx.from.name}
              </span>
              <ArrowRight size={10} style={{ color: marketplace ? "#22C55E" : "var(--gray-300)" }} />
              <span className="font-mono text-[9px] font-semibold" style={{
                color: AGENT_CONFIG[tx.to.id as keyof typeof AGENT_CONFIG]?.color ?? (marketplace ? "#22C55E" : "var(--green-400)")
              }}>
                {tx.to.name}
              </span>
              {marketplace && (
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
                  style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "1px solid rgba(34, 197, 94, 0.22)" }}
                >
                  NVM x402
                </span>
              )}
              <span className="ml-auto font-mono text-[9px] font-bold" style={{ color: marketplace ? "#22C55E" : "var(--green-400)" }}>
                {tx.credits}cr
              </span>
              <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                {new Date(tx.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {tx.purpose && (
                <p className="truncate text-[10px]" style={{ color: "var(--gray-400)" }}>
                  {tx.purpose}
                </p>
              )}
              {tx.status === "completed" && marketplace && (
                <span className="shrink-0 font-mono text-[7px]" style={{ color: "#22C55E" }}>
                  ✓ settled
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Brief View ─────────────────────────────────────────────────────
function BriefView({ brief, adsMuted }: { brief: StructuredBrief; adsMuted: boolean }) {
  const [copied, setCopied] = useState(false);

  const buildText = useCallback(() => [
    `# ${brief.title}`, "",
    `**Objective:** ${brief.objective}`, "",
    brief.scope.length ? `## Scope\n${brief.scope.map((s) => `- ${s}`).join("\n")}` : "",
    brief.keyQuestions.length ? `## Key Questions\n${brief.keyQuestions.map((q) => `- ${q}`).join("\n")}` : "",
    brief.deliverables.length ? `## Deliverables\n${brief.deliverables.map((d) => `- ${d}`).join("\n")}` : "",
    brief.constraints.length ? `## Constraints\n${brief.constraints.map((c) => `- ${c}`).join("\n")}` : "",
  ].filter(Boolean).join("\n"), [brief]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildText()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildText, brief.title]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <Sparkles size={16} style={{ color: AGENT_CONFIG.strategist.color }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>{brief.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{brief.provider}/{brief.model}</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{brief.creditsUsed}cr</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{(brief.durationMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }} title="Download as Markdown">
            <Download size={12} />.md
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: AGENT_CONFIG.strategist.color }}>
          Structured Brief
        </p>
        <h3 className="mt-1 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>
          {brief.title}
        </h3>
      </div>

      <div className="rounded-lg p-3" style={{ background: "rgba(124, 58, 237, 0.04)", border: "1px solid rgba(124, 58, 237, 0.10)" }}>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
          {brief.objective}
        </p>
      </div>

      {brief.scope.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Scope</p>
          <div className="flex flex-wrap gap-1.5">
            {brief.scope.map((s, i) => (
              <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {brief.searchQueries.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Search Queries</p>
          <div className="space-y-1">
            {brief.searchQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <Search size={10} style={{ color: AGENT_CONFIG.researcher.color }} />
                <span className="text-[11px]" style={{ color: "var(--gray-500)" }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.keyQuestions.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Key Questions</p>
          <div className="space-y-1">
            {brief.keyQuestions.map((q, i) => (
              <p key={i} className="text-[11px]" style={{ color: "var(--gray-500)" }}>• {q}</p>
            ))}
          </div>
        </div>
      )}

      {brief.deliverables.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Deliverables</p>
          <div className="flex flex-wrap gap-1.5">
            {brief.deliverables.map((d, i) => (
              <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "rgba(201, 125, 78, 0.07)", border: "1px solid rgba(201, 125, 78, 0.18)", color: "var(--accent-400)" }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {brief.constraints.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Constraints</p>
          <div className="space-y-1">
            {brief.constraints.map((c, i) => (
              <p key={i} className="text-[11px]" style={{ color: "var(--gray-500)" }}>⚠ {c}</p>
            ))}
          </div>
        </div>
      )}

      <ZeroClickAd
        query={[brief.title, ...brief.scope.slice(0, 2)].filter(Boolean).join(" · ")}
        muted={adsMuted}
        signals={[
          { category: "interest" as const, confidence: 0.9, subject: brief.title, relatedSubjects: brief.scope.slice(0, 4), sentiment: "positive" as const },
          ...(brief.keyQuestions.length > 0 ? [{ category: "evaluation" as const, confidence: 0.75, subject: brief.keyQuestions[0], sentiment: "neutral" as const }] : []),
        ]}
      />

      </div>
    </div>
  );
}

// ─── Markdown Renderer ─────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--gray-700)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline-offset-2 underline" style={{ color: "var(--accent-400)" }}>{linkMatch[1]}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${key++}`} className="my-2 space-y-1.5 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.55 }} />
            <span>{parseInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h5 key={key++} className="mb-1 mt-4 text-[13px] font-semibold" style={{ color: "var(--gray-700)" }}>{line.slice(4)}</h5>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h4 key={key++} className="mb-2 mt-5 text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>{line.slice(3)}</h4>);
    } else if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++} className="text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{parseInline(line)}</p>);
    }
  });
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

// ─── Document View ──────────────────────────────────────────────────
function DocumentView({
  doc,
  adQuery,
  adSignals,
  adsMuted = false,
}: {
  doc: ResearchDocument;
  adQuery?: string;
  adSignals?: ZeroClickSignal[];
  adsMuted?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const buildMarkdown = useCallback(() => [
    `# ${doc.title}`, "", doc.summary, "",
    ...doc.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
    "## Sources", ...doc.sources.map((s) => `- [${s.title}](${s.url})`),
  ].join("\n"), [doc]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildMarkdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildMarkdown, doc.title]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <FileText size={16} style={{ color: AGENT_CONFIG.researcher.color }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>{doc.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.provider}/{doc.model}</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.creditsUsed}cr</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{(doc.durationMs / 1000).toFixed(1)}s</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.sources.length} sources</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }} title="Download as Markdown">
            <Download size={12} />
            .md
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(14, 165, 233, 0.04)", border: "1px solid rgba(14, 165, 233, 0.10)" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>{doc.summary}</p>
        </div>

        <div className="space-y-6">
          {doc.sections.map((section, i) => (
            <div key={i}>
              <h3 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>{section.heading}</h3>
              <MarkdownContent text={section.content} />
            </div>
          ))}
        </div>

        <ZeroClickAd query={adQuery ?? doc.query} muted={adsMuted} signals={adSignals} />

        {doc.sources.length > 0 && (
          <div className="mt-8 border-t pt-5" style={{ borderColor: "var(--border-default)" }}>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Sources ({doc.sources.length})
            </p>
            <div className="space-y-2">
              {doc.sources.map((source, i) => (
                <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-white/3">
                  <ExternalLink size={12} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>{source.title}</p>
                    <p className="truncate font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{source.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────
function LoadingSkeleton({ mode, events, elapsed, onCancel }: { mode: ViewMode; events: PipelineEvent[]; elapsed?: number; onCancel?: () => void }) {
  const lastEvent = events[events.length - 1];
  const stageLabels: Record<string, string> = {
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
  };
  const currentLabel = lastEvent ? (stageLabels[lastEvent.stage] ?? lastEvent.message) : "Initializing pipeline…";

  const agentWorking = lastEvent?.agent ?? "pipeline";
  const color = AGENT_CONFIG[agentWorking as keyof typeof AGENT_CONFIG]?.color ?? "var(--green-400)";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8">
      {/* Animated ring */}
      <div className="relative flex size-20 items-center justify-center">
        <div
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            border: `2px solid transparent`,
            borderTopColor: color,
            borderRightColor: color,
            animationDuration: "1.5s",
          }}
        />
        <div
          className="absolute inset-2 animate-spin rounded-full"
          style={{
            border: `2px solid transparent`,
            borderBottomColor: color,
            animationDuration: "2.5s",
            animationDirection: "reverse",
          }}
        />
        {mode === "pipeline" ? (
          <Bot size={28} style={{ color }} />
        ) : mode === "seller" ? (
          <Package size={28} style={{ color }} />
        ) : agentWorking === "strategist" ? (
          <Sparkles size={28} style={{ color }} />
        ) : (
          <Search size={28} style={{ color }} />
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="mb-1 text-[14px] font-semibold" style={{ color: "var(--gray-700)" }}>
          {mode === "pipeline" ? "Pipeline Running" : mode === "seller" ? "Seller Fulfilling" : agentWorking === "strategist" ? "Strategist Working" : "Researcher Working"}
        </p>
        <p className="max-w-sm text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          {currentLabel}
        </p>
        <p className="mt-2 font-mono text-[10px]" style={{ color: "var(--gray-300)" }}>
          {elapsed != null && elapsed > 0 ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed · ` : ""}
          {mode === "pipeline" ? "Usually 3–7 min" : mode === "seller" ? "Usually 3–5 min" : mode === "researcher" ? "Usually 1–3 min" : "Usually 30–60 sec"}
          {events.length > 0 && ` · ${events.length} stage${events.length !== 1 ? "s" : ""} complete`}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {events.map((evt, i) => (
          <div
            key={evt.id}
            className="size-2 rounded-full transition-all"
            style={{
              background: i === events.length - 1 ? color : "var(--gray-300)",
              opacity: i === events.length - 1 ? 1 : 0.4,
            }}
          />
        ))}
        <div className="size-2 animate-pulse rounded-full" style={{ background: color }} />
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono text-[11px] transition-all hover:opacity-80"
          style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.20)", color: "#EF4444" }}
        >
          <RotateCcw size={11} /> Cancel
        </button>
      )}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
const EXAMPLE_PROMPTS: Record<ViewMode, string[]> = {
  pipeline: [
    "What are the best AI agent frameworks in 2025?",
    "Research the market for no-code automation tools",
    "Analyze competitors to Notion for team knowledge bases",
    "Write a product plan for a SaaS invoice tool",
    "Research emerging trends in autonomous AI payments",
  ],
  strategist: [
    "Build a go-to-market brief for a developer API product",
    "Structure a launch plan for a B2B SaaS tool",
    "Outline key questions for a market entry into healthcare AI",
    "Define scope and deliverables for a mobile app MVP",
  ],
  researcher: [
    "What are the top Nevermined use cases in 2025?",
    "Find recent research on LLM agent architectures",
    "Compare Exa, Perplexity, and Tavily for AI search",
    "What are developers building with the Apify platform?",
  ],
  seller: [
    "Generate a deep research report on AI agent frameworks",
    "Produce a competitive intelligence brief on no-code tools",
    "Create a market analysis for autonomous payment systems",
    "Write a strategic plan for entering the developer tools market",
  ],
};

function EmptyState({ mode, onExample }: { mode: ViewMode; onExample: (p: string) => void }) {
  const config = {
    pipeline: {
      icon: Bot,
      title: "Agent Pipeline",
      desc: "Describe what you need. The Strategist structures your brief, the Researcher searches the web, the Buyer procures marketplace assets, and the Seller fulfills external orders.",
    },
    strategist: {
      icon: Sparkles,
      title: "Strategist Agent",
      desc: "Enter a topic or idea. Get a structured brief with search queries, scope, and deliverables.",
    },
    researcher: {
      icon: Search,
      title: "Researcher Agent",
      desc: "Enter a research query. The agent searches and scrapes the web, then returns a structured report with citations.",
    },
    seller: {
      icon: Package,
      title: "Seller Agent",
      desc: "Describe what a buyer needs. The Seller matches it to a product, plans fulfillment, and generates the output using the internal pipeline.",
    },
  };
  const c = config[mode];
  const examples = EXAMPLE_PROMPTS[mode];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl" style={{ background: "rgba(201, 125, 78, 0.08)" }}>
        <c.icon size={28} style={{ color: "var(--accent-400)" }} />
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold" style={{ color: "var(--gray-800)" }}>{c.title}</h3>
        <p className="max-w-md text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>{c.desc}</p>
      </div>
      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExample(ex)}
            className="rounded-lg px-3 py-1.5 text-left text-[11px] leading-snug transition-all duration-150"
            style={{
              background: "var(--glass-bg)",
              color: "var(--gray-500)",
              border: "1px solid var(--border-default)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.25)";
              e.currentTarget.style.color = "var(--gray-700)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--gray-500)";
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ad Context Extraction ──────────────────────────────────────────
function extractAdContext(brief?: StructuredBrief, purchasedAssets?: PurchasedAsset[]): { query: string; signals: ZeroClickSignal[] } {
  if (!brief) return { query: "", signals: [] };

  const query = [brief.title, ...brief.scope.slice(0, 2)].filter(Boolean).join(" · ");

  const signals: ZeroClickSignal[] = [];

  if (brief.title) {
    signals.push({
      category: "interest",
      confidence: 0.9,
      subject: brief.title,
      relatedSubjects: brief.scope.slice(0, 4),
      sentiment: "positive",
    });
  }

  if (brief.keyQuestions.length > 0) {
    signals.push({
      category: "evaluation",
      confidence: 0.75,
      subject: brief.keyQuestions[0],
      relatedSubjects: brief.keyQuestions.slice(1, 3),
      sentiment: "neutral",
    });
  }

  if (brief.deliverables.length > 0) {
    signals.push({
      category: "recommendation_request",
      confidence: 0.8,
      subject: brief.deliverables[0],
      sentiment: "positive",
    });
  }

  // Agentic: when Buyer purchased marketplace assets, inject purchase_intent signals
  if (purchasedAssets && purchasedAssets.length > 0) {
    signals.push({
      category: "purchase_intent",
      confidence: 0.95,
      subject: purchasedAssets[0].name,
      relatedSubjects: purchasedAssets.slice(1, 4).map((a) => a.name),
      sentiment: "positive",
    });
  }

  return { query, signals };
}

// ─── Main Studio Page ───────────────────────────────────────────────
export function StudioPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ViewMode>("pipeline");
  const [outputType, setOutputType] = useState<OutputType>("research");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rightTab, setRightTab] = useState<"document" | "brief" | "purchases">("document");
  const [bottomTab, setBottomTab] = useState<"stages" | "transactions">("stages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialStats, setInitialStats] = useState<{ strategist: { earned: number; handled: number }; researcher: { earned: number; handled: number }; buyer: { earned: number; handled: number }; seller: { earned: number; handled: number } }>({
    strategist: { earned: 0, handled: 0 },
    researcher: { earned: 0, handled: 0 },
    buyer: { earned: 0, handled: 0 },
    seller: { earned: 0, handled: 0 },
  });
  const transactions = useTransactionStream();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [adsMuted, setAdsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiMode, setApiMode] = useState<"demo" | "live" | "checking">("checking");
  const [toolSettings, setToolSettings] = useState<ToolSettings>(() => loadToolSettings());
  const [judgeMode, setJudgeMode] = useState(false);
  const [adToolsUsed, setAdToolsUsed] = useState<SponsorToolUsage[]>([]);

  const handleAdServed = useCallback(() => {
    setAdToolsUsed((prev) => {
      if (prev.some((t) => t.tool === "zeroclick-ad")) return prev;
      return [...prev, { tool: "zeroclick-ad", label: "ZeroClick Contextual Ad Served", sponsor: "ZeroClick", timestamp: new Date().toISOString() }];
    });
  }, []);

  const handleJudgePreset = useCallback((preset: JudgePreset) => {
    setInput(preset.prompt);
    setMode(preset.mode);
    setOutputType(preset.outputType);
    // Apply tool overrides
    setToolSettings((prev) => {
      const next = {
        ...prev,
        ...(preset.toolOverrides.researcher ? { researcher: { ...prev.researcher, ...preset.toolOverrides.researcher } } : {}),
        ...(preset.toolOverrides.trading ? { trading: { ...prev.trading, ...preset.toolOverrides.trading } } : {}),
      };
      saveToolSettings(next);
      return next;
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("zc_ads_muted");
    if (stored === "true") setAdsMuted(true);
  }, []);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const hasLLM = d.openai || d.gemini || d.anthropic;
        setApiMode(hasLLM ? "live" : "demo");
      })
      .catch(() => setApiMode("demo"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const m = params.get("mode");
    if (q) {
      setInput(decodeURIComponent(q));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (m === "strategist" || m === "researcher" || m === "seller") setMode(m);

    // Restore last result from localStorage
    try {
      const saved = localStorage.getItem("ab_last_result");
      if (saved && !q) {
        const parsed = JSON.parse(saved) as { result: PipelineResult; input: string; mode: ViewMode };
        setResult(parsed.result);
        setInput(parsed.input);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.result.document) setRightTab("document");
        else if (parsed.result.brief) setRightTab("brief");
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  function toggleAdsMuted() {
    setAdsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("zc_ads_muted", String(next));
      return next;
    });
  }

  const adContext = useMemo(() => extractAdContext(result?.brief, result?.purchasedAssets), [result?.brief, result?.purchasedAssets]);

  // Fetch persisted stats on mount
  useEffect(() => {
    fetch("/api/pipeline/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.agents) {
          setInitialStats({
            strategist: { earned: data.agents.strategist?.creditsEarned ?? 0, handled: data.agents.strategist?.requestsHandled ?? 0 },
            researcher: { earned: data.agents.researcher?.creditsEarned ?? 0, handled: data.agents.researcher?.requestsHandled ?? 0 },
            buyer: { earned: data.agents.buyer?.creditsEarned ?? 0, handled: data.agents.buyer?.requestsHandled ?? 0 },
            seller: { earned: data.agents.seller?.creditsEarned ?? 0, handled: data.agents.seller?.requestsHandled ?? 0 },
          });
        }
      })
      .catch(() => { /* stats unavailable */ });
  }, []);

  // Aggregate stats: initial + live SSE transactions
  const agentStats = {
    strategist: {
      earned: initialStats.strategist.earned + transactions.filter((t) => t.to.id === "strategist" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.strategist.handled + transactions.filter((t) => t.to.id === "strategist" && t.status === "completed").length,
    },
    researcher: {
      earned: initialStats.researcher.earned + transactions.filter((t) => t.to.id === "researcher" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.researcher.handled + transactions.filter((t) => t.to.id === "researcher" && t.status === "completed").length,
    },
    buyer: {
      earned: initialStats.buyer.earned + transactions.filter((t) => t.to.id === "buyer" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.buyer.handled + transactions.filter((t) => t.to.id === "buyer" && t.status === "completed").length,
    },
    seller: {
      earned: initialStats.seller.earned + transactions.filter((t) => t.to.id === "seller" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.seller.handled + transactions.filter((t) => t.to.id === "seller" && t.status === "completed").length,
    },
  };

  function handleNewRequest() {
    setInput("");
    setResult(null);
    setPipelineEvents([]);
    setError(null);
    setAdToolsUsed([]);
    inputRef.current?.focus();
  }

  function handleCancel() {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(false);
    setError("Request cancelled");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPipelineEvents([]);
    setElapsed(0);

    // Start elapsed timer
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    // Open SSE stream to receive real-time pipeline events while the POST runs
    const eventSource = new EventSource("/api/agent/events");
    eventSource.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data) as { id: string; type: string; timestamp: string; data: Record<string, unknown> };
        const mapped: PipelineEvent = {
          id: raw.id,
          timestamp: raw.timestamp,
          stage: String(raw.data?.stage ?? raw.type ?? "unknown"),
          agent: String(raw.data?.agent ?? "pipeline"),
          message: String(raw.data?.message ?? raw.type?.replace(/_/g, " ") ?? ""),
          data: raw.data,
        };
        setPipelineEvents((prev) => [...prev.slice(-49), mapped]);
      } catch { /* ignore parse errors */ }
    };

    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          outputType,
          mode,
          toolSettings,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setResult(data);
      if (data.events) setPipelineEvents(data.events);
      if (data.document) setRightTab("document");
      else if (data.brief) setRightTab("brief");

      // Persist last result to localStorage
      try { localStorage.setItem("ab_last_result", JSON.stringify({ result: data, input: input.trim(), mode })); } catch { /* quota exceeded */ }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // already handled by handleCancel
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      eventSource.close();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false);
    }
  }

  // Keyboard shortcuts: Escape to cancel, Cmd/Ctrl+K to open settings
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape: cancel running pipeline
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        handleCancel();
      }
      // Cmd/Ctrl+K: toggle settings
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
      // Cmd/Ctrl+N: new request (when not loading)
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isLoading) {
        e.preventDefault();
        handleNewRequest();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  return (
    <>
    <SettingsPanel
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      settings={toolSettings}
      onChange={(next) => {
        setToolSettings(next);
        saveToolSettings(next);
      }}
    />
    <div className="flex h-screen flex-col" style={{ background: "var(--bg-base)" }}>
      <Nav />

      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute left-3 top-[68px] z-20 flex size-8 items-center justify-center rounded-lg lg:hidden"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
        >
          {sidebarOpen ? <PanelLeftClose size={14} style={{ color: "var(--gray-400)" }} /> : <PanelLeftOpen size={14} style={{ color: "var(--gray-400)" }} />}
        </button>

        {/* ── LEFT PANE: Controls ── */}
        <div
          className={`flex w-[380px] shrink-0 flex-col border-r transition-all duration-200 max-lg:absolute max-lg:inset-y-14 max-lg:left-0 max-lg:z-10 ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
          style={{ borderColor: "var(--border-default)", background: "var(--bg-base)" }}
        >

          {/* Demo / Live mode banner */}
          {apiMode !== "checking" && (
            <div
              className="flex items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: "var(--border-default)", background: apiMode === "demo" ? "rgba(245,158,11,0.04)" : "rgba(34,197,94,0.03)" }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: apiMode === "demo" ? "#F59E0B" : "var(--green-400)" }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: apiMode === "demo" ? "#F59E0B" : "var(--green-400)", opacity: apiMode === "demo" ? 0.8 : 1 }}
                />
                {apiMode === "demo" ? "Demo Mode" : "Live Mode"}
              </span>
              {apiMode === "demo" && (
                <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                  Add API keys to go live
                </span>
              )}
            </div>
          )}

          {/* Agent Cards */}
          <div className="space-y-2 border-b p-3" style={{ borderColor: "var(--border-default)" }}>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Agents
            </p>
            <AgentCard
              agent={AGENT_CONFIG.strategist}
              isActive={isLoading && (mode === "pipeline" || mode === "strategist")}
              isSelected={mode === "strategist"}
              onClick={() => setMode(mode === "strategist" ? "pipeline" : "strategist")}
              stats={agentStats.strategist}
              toolLabel={toolSettings.strategist.search}
            />
            {mode === "pipeline" && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2">
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                  <ArrowRight size={12} style={{ color: "var(--gray-300)" }} />
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                </div>
              </div>
            )}
            <AgentCard
              agent={AGENT_CONFIG.researcher}
              isActive={isLoading && (mode === "pipeline" || mode === "researcher")}
              isSelected={mode === "researcher"}
              onClick={() => setMode(mode === "researcher" ? "pipeline" : "researcher")}
              stats={agentStats.researcher}
              toolLabel={toolSettings.researcher.search}
            />
            {mode === "pipeline" && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2">
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                  <ArrowRight size={12} style={{ color: "var(--gray-300)" }} />
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                </div>
              </div>
            )}
            <AgentCard
              agent={AGENT_CONFIG.buyer}
              isActive={isLoading && mode === "pipeline"}
              isSelected={false}
              onClick={() => {}}
              stats={agentStats.buyer}
              toolLabel="nevermined"
            />
            {mode === "pipeline" && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2">
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                  <ArrowRight size={12} style={{ color: "var(--gray-300)" }} />
                  <div className="h-px w-6" style={{ background: "var(--border-default)" }} />
                </div>
              </div>
            )}
            <AgentCard
              agent={AGENT_CONFIG.seller}
              isActive={isLoading && (mode === "pipeline" || mode === "seller")}
              isSelected={mode === "seller"}
              onClick={() => setMode(mode === "seller" ? "pipeline" : "seller")}
              stats={agentStats.seller}
              toolLabel="nevermined"
            />
          </div>

          {/* Mode indicator */}
          <div className="border-b px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[9px] font-semibold uppercase"
                style={{
                  background: mode === "pipeline" ? "rgba(201, 125, 78, 0.10)" :
                    AGENT_CONFIG[mode]?.bgColor ?? AGENT_CONFIG.researcher.bgColor,
                  color: mode === "pipeline" ? "var(--accent-400)" :
                    AGENT_CONFIG[mode]?.color ?? AGENT_CONFIG.researcher.color,
                  border: `1px solid ${mode === "pipeline" ? "rgba(201, 125, 78, 0.20)" :
                    AGENT_CONFIG[mode]?.borderColor ?? AGENT_CONFIG.researcher.borderColor}`,
                }}
              >
                {mode === "pipeline" ? "⚡ Full Pipeline" : mode === "strategist" ? "◆ Strategist Only" : mode === "researcher" ? "◈ Researcher Only" : "◇ Seller Only"}
              </span>
              {mode !== "pipeline" && (
                <button
                  onClick={() => setMode("pipeline")}
                  className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] transition-colors"
                  style={{ color: "var(--gray-400)", background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
                >
                  <RefreshCw size={9} /> Full Pipeline
                </button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setJudgeMode((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{
                    color: judgeMode ? "var(--accent-400)" : "var(--gray-400)",
                    background: judgeMode ? "rgba(201, 125, 78, 0.10)" : "var(--glass-bg)",
                    border: `1px solid ${judgeMode ? "rgba(201, 125, 78, 0.22)" : "var(--border-default)"}`,
                  }}
                  title="Judge Demo Mode"
                >
                  <Award size={10} />
                  judge
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
                  title="Tool Settings"
                >
                  <Settings size={10} />
                  tools
                </button>
              </div>
            </div>
            <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
              {mode === "pipeline"
                ? "Strategist → Researcher → Buyer → Seller. Full research + planning deliverable."
                : mode === "strategist"
                ? "Structured brief only. Fast strategy output, no web research."
                : mode === "researcher"
                ? "Web research only. Searches and synthesizes from live sources."
                : "Seller fulfillment mode. Matches to a product and generates output via internal pipeline."}
            </p>
          </div>

          {/* Output type selector (only for pipeline/strategist) */}
          {mode !== "researcher" && (
            <div className="flex flex-wrap gap-1 border-b px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
              {OUTPUT_TYPES.map((ot) => (
                <button
                  key={ot.value}
                  onClick={() => setOutputType(ot.value)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-all"
                  style={{
                    background: outputType === ot.value ? "rgba(201, 125, 78, 0.10)" : "transparent",
                    border: `1px solid ${outputType === ot.value ? "rgba(201, 125, 78, 0.20)" : "var(--border-default)"}`,
                    color: outputType === ot.value ? "var(--accent-400)" : "var(--gray-400)",
                  }}
                >
                  <ot.icon size={10} />
                  {ot.label}
                </button>
              ))}
            </div>
          )}

          {/* Judge Mode Presets */}
          {judgeMode && (
            <div className="border-b p-3" style={{ borderColor: "var(--border-default)", background: "rgba(201, 125, 78, 0.02)" }}>
              <JudgeMode onSelect={handleJudgePreset} />
            </div>
          )}

          {/* Cost estimate + Input */}
          <div className="border-b p-3" style={{ borderColor: "var(--border-default)" }}>
            {input.trim() && !isLoading && (
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md px-2 py-0.5 font-mono text-[9px]" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "var(--green-400)" }}>
                  ~{mode === "pipeline" ? "6–16" : mode === "seller" ? "6–16" : mode === "researcher" ? "1–10" : "1"} credits
                </span>
                <span className="text-[9px]" style={{ color: "var(--gray-300)" }}>estimated cost</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={
                    mode === "researcher"
                      ? "What would you like to research?"
                      : mode === "seller"
                      ? "Describe what a buyer needs…"
                      : "Describe what you need…"
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 pr-12 text-[13px] leading-relaxed outline-none"
                  style={{ background: "var(--glass-bg-strong)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-lg transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))" }}
                  title="Send (Enter ↵)"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
              {error && (
                <div className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[12px] font-medium" style={{ color: "#EF4444" }}>{error}</p>
                      {apiMode === "demo" && (
                        <p className="mt-0.5 text-[11px]" style={{ color: "var(--gray-400)" }}>
                          Running in Demo Mode — add an OpenAI or Gemini key in environment variables to get real results.
                        </p>
                      )}
                      {pipelineEvents.length > 0 && (
                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>
                          Failed after {pipelineEvents.length} stage{pipelineEvents.length !== 1 ? "s" : ""}
                          {elapsed > 0 && ` · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSubmit as unknown as React.MouseEventHandler}
                      className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[10px] transition-all hover:opacity-80"
                      style={{ background: "rgba(201,125,78,0.10)", border: "1px solid rgba(201,125,78,0.22)", color: "var(--accent-400)" }}
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Bottom section: Stages / Transactions toggle */}
          <div className="flex border-b" style={{ borderColor: "var(--border-default)" }}>
            {(["stages", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBottomTab(tab)}
                className="flex-1 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  color: bottomTab === tab ? "var(--accent-400)" : "var(--gray-400)",
                  borderBottom: bottomTab === tab ? "2px solid var(--accent-400)" : "2px solid transparent",
                }}
              >
                {tab === "stages" ? "Pipeline Stages" : `Transactions (${transactions.length})`}
              </button>
            ))}
          </div>

          {/* Bottom panel content */}
          <div className="flex-1 overflow-hidden">
            {bottomTab === "stages" ? (
              <PipelineStages events={pipelineEvents} isRunning={isLoading} />
            ) : (
              <TransactionFeed transactions={transactions} />
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 border-t px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-1.5">
              <Zap size={11} style={{ color: "var(--accent-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {result?.totalCredits ?? 0}cr
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {result?.totalDurationMs ? `${(result.totalDurationMs / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {result?.iterations ?? 0} iter
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {result?.document?.sources.length ?? 0} sources
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {result?.purchasedAssets?.length ?? 0} purchases
              </span>
            </div>
            <button
              onClick={toggleAdsMuted}
              title={adsMuted ? "Ads muted — click to enable" : "Click to mute ads"}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[9px] transition-all"
              style={{
                background: adsMuted ? "rgba(239, 68, 68, 0.08)" : "transparent",
                border: `1px solid ${adsMuted ? "rgba(239, 68, 68, 0.20)" : "var(--border-default)"}`,
                color: adsMuted ? "#EF4444" : "var(--gray-400)",
              }}
            >
              {adsMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
              <span>{adsMuted ? "ads off" : "ads"}</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT PANE: Output ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b" style={{ borderColor: "var(--border-default)" }}>
            {result?.document && (
              <button
                onClick={() => setRightTab("document")}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-semibold transition-colors"
                style={{
                  color: rightTab === "document" ? AGENT_CONFIG.researcher.color : "var(--gray-400)",
                  borderBottom: rightTab === "document" ? `2px solid ${AGENT_CONFIG.researcher.color}` : "2px solid transparent",
                }}
              >
                <FileText size={12} /> Report
              </button>
            )}
            {result?.brief && (
              <button
                onClick={() => setRightTab("brief")}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-semibold transition-colors"
                style={{
                  color: rightTab === "brief" ? AGENT_CONFIG.strategist.color : "var(--gray-400)",
                  borderBottom: rightTab === "brief" ? `2px solid ${AGENT_CONFIG.strategist.color}` : "2px solid transparent",
                }}
              >
                <Sparkles size={12} /> Brief
              </button>
            )}
            {(result?.purchasedAssets?.length ?? 0) > 0 && (
              <button
                onClick={() => setRightTab("purchases")}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-semibold transition-colors"
                style={{
                  color: rightTab === "purchases" ? AGENT_CONFIG.buyer.color : "var(--gray-400)",
                  borderBottom: rightTab === "purchases" ? `2px solid ${AGENT_CONFIG.buyer.color}` : "2px solid transparent",
                }}
              >
                <Package size={12} /> Purchases ({result?.purchasedAssets?.length})
              </button>
            )}

            {/* New Request button */}
            {(result || isLoading) && (
              <button
                onClick={handleNewRequest}
                disabled={isLoading}
                className="ml-auto mr-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all disabled:opacity-30"
                style={{
                  background: result ? "rgba(201, 125, 78, 0.08)" : "var(--glass-bg)",
                  border: result ? "1px solid rgba(201, 125, 78, 0.20)" : "1px solid var(--border-default)",
                  color: result ? "var(--accent-400)" : "var(--gray-500)",
                }}
              >
                <RotateCcw size={11} /> New Request
              </button>
            )}
          </div>

          {/* Sponsor Proof Rail */}
          <SponsorRail toolsUsed={result?.toolsUsed ?? result?.document?.toolsUsed} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingSkeleton mode={mode} events={pipelineEvents} elapsed={elapsed} onCancel={handleCancel} />
            ) : !result ? (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            ) : rightTab === "document" && result.document ? (
              <DocumentView
                doc={result.document}
                adQuery={adContext.query || result.brief?.title || result.document?.query}
                adSignals={adContext.signals}
                adsMuted={adsMuted}
              />
            ) : rightTab === "brief" && result.brief ? (
              <BriefView brief={result.brief} adsMuted={adsMuted} />
            ) : rightTab === "purchases" && result.purchasedAssets?.length ? (
              <div className="h-full overflow-y-auto p-6">
                <PurchasedAssetGrid assets={result.purchasedAssets} />
                <ZeroClickAd
                  query={result.brief?.title || result.document?.query || input}
                  muted={adsMuted}
                  signals={[{ category: "purchase_intent" as const, confidence: 0.85, subject: result.purchasedAssets[0]?.name || "marketplace asset", sentiment: "positive" as const }]}
                />
              </div>
            ) : (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
