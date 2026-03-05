"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { ZeroClickAd } from "@/components/ui/zeroclick-ad";

// ─── Types ──────────────────────────────────────────────────────────
interface ResearchSource {
  url: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
}

interface ResearchDocument {
  id: string;
  query: string;
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  sources: ResearchSource[];
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
}

interface StructuredBrief {
  id: string;
  originalInput: string;
  outputType: string;
  title: string;
  objective: string;
  scope: string[];
  searchQueries: string[];
  keyQuestions: string[];
  deliverables: string[];
  constraints: string[];
  context: string;
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
}

interface AgentTransaction {
  id: string;
  timestamp: string;
  from: { id: string; name: string };
  to: { id: string; name: string };
  credits: number;
  purpose: string;
  artifactId: string;
  status: string;
  durationMs?: number;
}

interface PipelineEvent {
  id: string;
  timestamp: string;
  stage: string;
  agent: string;
  message: string;
  data?: Record<string, unknown>;
}

interface PipelineResult {
  mode: string;
  id?: string;
  brief?: StructuredBrief;
  document?: ResearchDocument;
  transactions?: AgentTransaction[];
  events?: PipelineEvent[];
  totalCredits?: number;
  totalDurationMs?: number;
  iterations?: number;
  followUpBriefs?: StructuredBrief[];
  transaction?: AgentTransaction;
}

type ViewMode = "pipeline" | "strategist" | "researcher";
type OutputType = "research" | "prd" | "plan" | "analysis" | "general";

const OUTPUT_TYPES: { value: OutputType; label: string; icon: typeof FileText }[] = [
  { value: "research", label: "Research Report", icon: Search },
  { value: "prd", label: "PRD", icon: FileText },
  { value: "plan", label: "Strategic Plan", icon: LayoutList },
  { value: "analysis", label: "Analysis", icon: Sparkles },
  { value: "general", label: "General", icon: Globe },
];

const AGENT_CONFIG = {
  strategist: {
    id: "strategist",
    name: "Strategist",
    role: "Planning & Structuring",
    description: "Expands raw input into comprehensive structured briefs with search queries, scope, and deliverables.",
    avatar: "◆",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
    borderColor: "rgba(124, 58, 237, 0.20)",
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    role: "Web Research & Reporting",
    description: "Searches and scrapes the web, analyzes sources, and produces detailed reports with citations.",
    avatar: "◈",
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "rgba(14, 165, 233, 0.20)",
  },
};

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

// ─── Agent Card ─────────────────────────────────────────────────────
function AgentCard({
  agent,
  isActive,
  isSelected,
  onClick,
  stats,
}: {
  agent: typeof AGENT_CONFIG.strategist;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  stats: { earned: number; handled: number };
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-200"
      style={{
        background: isSelected ? agent.bgColor : "var(--glass-bg)",
        border: `1px solid ${isSelected ? agent.borderColor : "var(--border-default)"}`,
      }}
    >
      {/* Avatar */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
        style={{ background: agent.bgColor, color: agent.color }}
      >
        {agent.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
            {agent.name}
          </span>
          {isActive && (
            <span className="flex items-center gap-1">
              <span className="relative flex size-1.5">
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full opacity-50"
                  style={{ background: agent.color }}
                />
                <span
                  className="relative inline-flex size-1.5 rounded-full"
                  style={{ background: agent.color }}
                />
              </span>
              <span className="font-mono text-[9px]" style={{ color: agent.color }}>
                active
              </span>
            </span>
          )}
        </div>
        <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
          {agent.role}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
          {agent.description}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-[9px]" style={{ color: agent.color }}>
            {stats.earned}cr earned
          </span>
          <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
            {stats.handled} tasks
          </span>
        </div>
      </div>
    </button>
  );
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
      {events.map((event) => (
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
                  background: event.agent === "strategist" ? AGENT_CONFIG.strategist.bgColor :
                    event.agent === "researcher" ? AGENT_CONFIG.researcher.bgColor : "var(--glass-bg)",
                  color: event.agent === "strategist" ? AGENT_CONFIG.strategist.color :
                    event.agent === "researcher" ? AGENT_CONFIG.researcher.color : "var(--gray-400)",
                }}
              >
                {event.agent}
              </span>
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
              {event.message}
            </p>
          </div>
        </div>
      ))}
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

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-semibold" style={{
              color: AGENT_CONFIG[tx.from.id as keyof typeof AGENT_CONFIG]?.color ?? "var(--gray-400)"
            }}>
              {tx.from.name}
            </span>
            <ArrowRight size={10} style={{ color: "var(--gray-300)" }} />
            <span className="font-mono text-[9px] font-semibold" style={{
              color: AGENT_CONFIG[tx.to.id as keyof typeof AGENT_CONFIG]?.color ?? "var(--green-400)"
            }}>
              {tx.to.name}
            </span>
            <span className="ml-auto font-mono text-[9px] font-bold" style={{ color: "var(--green-400)" }}>
              {tx.credits}cr
            </span>
            <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
              {new Date(tx.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {tx.purpose && (
            <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--gray-400)" }}>
              {tx.purpose}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Brief View ─────────────────────────────────────────────────────
function BriefView({ brief }: { brief: StructuredBrief }) {
  return (
    <div className="space-y-4 px-5 py-4">
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
              <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.15)", color: "var(--green-400)" }}>
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

      <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
        <span className="font-mono text-[9px]" style={{ color: AGENT_CONFIG.strategist.color }}>{brief.provider}/{brief.model}</span>
        <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>{brief.creditsUsed}cr</span>
        <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>{(brief.durationMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ─── Document View ──────────────────────────────────────────────────
function DocumentView({
  doc,
  adQuery,
  adsMuted = false,
}: {
  doc: ResearchDocument;
  adQuery?: string;
  adsMuted?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = [
      `# ${doc.title}`, "", doc.summary, "",
      ...doc.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
      "## Sources", ...doc.sources.map((s) => `- [${s.title}](${s.url})`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [doc]);

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
        <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(14, 165, 233, 0.04)", border: "1px solid rgba(14, 165, 233, 0.10)" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>{doc.summary}</p>
        </div>

        <div className="space-y-6">
          {doc.sections.map((section, i) => (
            <div key={i}>
              <h3 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>{section.heading}</h3>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--gray-500)" }}>{section.content}</p>
            </div>
          ))}
        </div>

        <ZeroClickAd query={adQuery ?? doc.query} muted={adsMuted} />

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
function LoadingSkeleton({ mode, events }: { mode: ViewMode; events: PipelineEvent[] }) {
  const lastEvent = events[events.length - 1];
  const stageLabels: Record<string, string> = {
    strategist_working: "Strategist is analyzing your input…",
    strategist_complete: "Brief structured — handing off to Researcher…",
    researcher_buying: "Researcher purchasing brief from Strategist…",
    researcher_working: "Researcher searching and scraping the web…",
    researcher_evaluating: "Evaluating document completeness…",
    researcher_followup: "Requesting additional context…",
  };
  const currentLabel = lastEvent ? (stageLabels[lastEvent.stage] ?? lastEvent.message) : "Initializing pipeline…";

  const agentWorking = lastEvent?.agent ?? "pipeline";
  const color = agentWorking === "strategist" ? AGENT_CONFIG.strategist.color
    : agentWorking === "researcher" ? AGENT_CONFIG.researcher.color
    : "var(--green-400)";

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
        ) : agentWorking === "strategist" ? (
          <Sparkles size={28} style={{ color }} />
        ) : (
          <Search size={28} style={{ color }} />
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="mb-1 text-[14px] font-semibold" style={{ color: "var(--gray-700)" }}>
          {mode === "pipeline" ? "Pipeline Running" : agentWorking === "strategist" ? "Strategist Working" : "Researcher Working"}
        </p>
        <p className="max-w-sm text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          {currentLabel}
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
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
function EmptyState({ mode }: { mode: ViewMode }) {
  const config = {
    pipeline: {
      icon: Bot,
      title: "Agent Pipeline",
      desc: "Enter a request below. The Strategist will structure your brief, then the Researcher will search the web and produce a full report.",
    },
    strategist: {
      icon: Sparkles,
      title: "Strategist Agent",
      desc: "Enter a topic or idea. The Strategist will expand it into a comprehensive structured brief with search queries, scope, and deliverables.",
    },
    researcher: {
      icon: Search,
      title: "Researcher Agent",
      desc: "Enter a research query. The Researcher will search and scrape the web, then produce a structured report with citations.",
    },
  };
  const c = config[mode];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl" style={{ background: "rgba(34, 197, 94, 0.08)" }}>
        <c.icon size={28} style={{ color: "var(--green-400)" }} />
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold" style={{ color: "var(--gray-800)" }}>{c.title}</h3>
        <p className="max-w-md text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>{c.desc}</p>
      </div>
    </div>
  );
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
  const [rightTab, setRightTab] = useState<"document" | "brief">("document");
  const [bottomTab, setBottomTab] = useState<"stages" | "transactions">("stages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialStats, setInitialStats] = useState<{ strategist: { earned: number; handled: number }; researcher: { earned: number; handled: number } }>({
    strategist: { earned: 0, handled: 0 },
    researcher: { earned: 0, handled: 0 },
  });
  const transactions = useTransactionStream();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [adsMuted, setAdsMuted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("zc_ads_muted");
    if (stored === "true") setAdsMuted(true);
  }, []);

  function toggleAdsMuted() {
    setAdsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("zc_ads_muted", String(next));
      return next;
    });
  }

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
  };

  function handleNewRequest() {
    setInput("");
    setResult(null);
    setPipelineEvents([]);
    setError(null);
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPipelineEvents([]);

    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          outputType,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setResult(data);
      if (data.events) setPipelineEvents(data.events);
      // Auto-switch to best tab
      if (data.document) setRightTab("document");
      else if (data.brief) setRightTab("brief");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
            />
          </div>

          {/* Mode indicator */}
          <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
            <span
              className="rounded-md px-2 py-0.5 font-mono text-[9px] font-semibold uppercase"
              style={{
                background: mode === "pipeline" ? "rgba(34, 197, 94, 0.10)" :
                  mode === "strategist" ? AGENT_CONFIG.strategist.bgColor : AGENT_CONFIG.researcher.bgColor,
                color: mode === "pipeline" ? "var(--green-400)" :
                  mode === "strategist" ? AGENT_CONFIG.strategist.color : AGENT_CONFIG.researcher.color,
                border: `1px solid ${mode === "pipeline" ? "rgba(34, 197, 94, 0.20)" :
                  mode === "strategist" ? AGENT_CONFIG.strategist.borderColor : AGENT_CONFIG.researcher.borderColor}`,
              }}
            >
              {mode === "pipeline" ? "⚡ Pipeline" : mode === "strategist" ? "◆ Strategist Only" : "◈ Researcher Only"}
            </span>
            {mode !== "pipeline" && (
              <button
                onClick={() => setMode("pipeline")}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] transition-colors"
                style={{ color: "var(--gray-400)", background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
              >
                <RefreshCw size={9} /> Pipeline
              </button>
            )}
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
                    background: outputType === ot.value ? "rgba(34, 197, 94, 0.10)" : "transparent",
                    border: `1px solid ${outputType === ot.value ? "rgba(34, 197, 94, 0.20)" : "var(--border-default)"}`,
                    color: outputType === ot.value ? "var(--green-400)" : "var(--gray-400)",
                  }}
                >
                  <ot.icon size={10} />
                  {ot.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-b p-3" style={{ borderColor: "var(--border-default)" }}>
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
                      : "Describe what you need…"
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 pr-12 text-[13px] leading-relaxed outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-lg transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, var(--green-600), var(--green-500))" }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
              {error && <p className="mt-2 text-[12px]" style={{ color: "#EF4444" }}>{error}</p>}
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
                  color: bottomTab === tab ? "var(--green-400)" : "var(--gray-400)",
                  borderBottom: bottomTab === tab ? "2px solid var(--green-400)" : "2px solid transparent",
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
              <Zap size={11} style={{ color: "var(--green-400)" }} />
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

            {/* New Request button */}
            {(result || isLoading) && (
              <button
                onClick={handleNewRequest}
                disabled={isLoading}
                className="ml-auto mr-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all disabled:opacity-30"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
              >
                <RotateCcw size={11} /> New Request
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingSkeleton mode={mode} events={pipelineEvents} />
            ) : !result ? (
              <EmptyState mode={mode} />
            ) : rightTab === "document" && result.document ? (
              <DocumentView
                doc={result.document}
                adQuery={result.brief?.title ?? result.document?.query}
                adsMuted={adsMuted}
              />
            ) : rightTab === "brief" && result.brief ? (
              <div className="h-full overflow-y-auto">
                <BriefView brief={result.brief} />
              </div>
            ) : (
              <EmptyState mode={mode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
