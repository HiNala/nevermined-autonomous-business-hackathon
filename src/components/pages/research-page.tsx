"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Nav } from "@/components/layout/nav";
import { Send, FileText, Globe, Clock, Zap, Loader2, ChevronRight, ExternalLink, Copy, Check, Download } from "lucide-react";
import type { AIProvider } from "@/lib/ai/providers";
import { ToolSettingsButton } from "@/components/ui/tool-settings-panel";
import { loadToolSettings, type ToolSettings } from "@/lib/tool-settings";
import type { ResearchSource, ResearchDocument } from "@/types/pipeline";
import { ZeroClickAd } from "@/components/ui/zeroclick-ad";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { SourcesPanel } from "@/components/ui/sources-panel";

interface AgentEvent {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

type ResearchDepth = "quick" | "standard" | "deep";

const DEPTH_CONFIG = {
  quick: { label: "Quick", credits: 1, desc: "3 sources, ~15s" },
  standard: { label: "Standard", credits: 5, desc: "5 sources, ~30s" },
  deep: { label: "Deep", credits: 10, desc: "8 sources, ~60s" },
} as const;

// ─── Hooks ──────────────────────────────────────────────────────────
function useSSE() {
  const [events, setEvents] = useState<AgentEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/agent/events");

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as AgentEvent;
        setEvents((prev) => [...prev.slice(-49), event]);
      } catch {
        // ignore parse errors
      }
    };

    return () => eventSource.close();
  }, []);

  return events;
}

// ─── Sub-components ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-2xl"
        style={{ background: "rgba(201, 125, 78, 0.08)" }}
      >
        <FileText size={24} style={{ color: "var(--accent-400)" }} />
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--gray-800)" }}>
          Research Output
        </h3>
        <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          Your structured report will appear here.
        </p>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: "var(--gray-400)" }}>
        <span className="rounded-md px-2 py-0.5" style={{ background: "rgba(201,125,78,0.06)", border: "1px solid rgba(201,125,78,0.14)", color: "var(--accent-400)" }}>1. Query</span>
        <span style={{ color: "var(--gray-300)" }}>→</span>
        <span className="rounded-md px-2 py-0.5" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.14)", color: "#0EA5E9" }}>2. Search &amp; Scrape</span>
        <span style={{ color: "var(--gray-300)" }}>→</span>
        <span className="rounded-md px-2 py-0.5" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)", color: "#7C3AED" }}>3. Report</span>
      </div>
    </div>
  );
}

function DocumentView({ doc }: { doc: ResearchDocument }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"report" | "sources">("report");

  const buildMarkdown = useCallback(() => [
    `# ${doc.title}`, "", doc.summary, "",
    ...doc.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
    "## Sources", ...doc.sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`),
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
      {/* Document header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <FileText size={16} style={{ color: "var(--accent-400)" }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
              {doc.title}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {doc.provider}/{doc.model}
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {doc.creditsUsed}cr
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {(doc.durationMs / 1000).toFixed(1)}s
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {doc.sources.length} sources
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Report / Sources toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}>
            {(["report", "sources"] as const).map((m) => {
              const labels = { report: "Report", sources: "Sources" };
              const active = viewMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="px-2.5 py-1 font-mono text-[9px] font-semibold transition-all"
                  style={{
                    background: active ? "rgba(201,125,78,0.12)" : "transparent",
                    color: active ? "var(--accent-400)" : "var(--gray-400)",
                    borderRight: m === "report" ? "1px solid var(--border-default)" : "none",
                  }}
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
            title="Download as Markdown"
          >
            <Download size={12} />.md
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {viewMode === "sources" ? (
          <SourcesPanel sources={doc.sources} toolsUsed={doc.toolsUsed} />
        ) : (
          <>
            {/* Summary */}
            <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(201, 125, 78, 0.04)", border: "1px solid rgba(201, 125, 78, 0.12)" }}>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
                {doc.summary}
              </p>
            </div>

            {/* Sections with inline citations */}
            <div className="space-y-6">
              {doc.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>
                    {section.heading}
                  </h3>
                  <MarkdownContent text={section.content} sources={doc.sources} />
                </div>
              ))}
            </div>

            <ZeroClickAd query={doc.query || doc.title} muted={false} />

            {/* Inline sources footer with citations */}
            {doc.sources.length > 0 && (
              <div className="mt-8 border-t pt-5" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                    Sources ({doc.sources.length})
                  </p>
                  <button
                    onClick={() => setViewMode("sources")}
                    className="font-mono text-[9px] font-semibold transition-colors"
                    style={{ color: "var(--accent-400)" }}
                  >
                    View details →
                  </button>
                </div>
                <div className="space-y-1.5">
                  {doc.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-black/3"
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold mt-0.5"
                        style={{ background: "rgba(14,165,233,0.08)", color: "#0EA5E9" }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium" style={{ color: "var(--gray-600)" }}>
                          {source.title}
                        </p>
                        <p className="truncate font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                          {source.url}
                        </p>
                      </div>
                      <ExternalLink size={10} className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--gray-400)" }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventLogPanel({ events }: { events: AgentEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const typeColors: Record<string, string> = {
    request_received: "var(--green-400)",
    research_started: "#0EA5E9",
    research_complete: "var(--green-400)",
    payment_verified: "#7C3AED",
    error: "#EF4444",
  };

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
          Waiting for events…
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-2 py-1.5 border-b" style={{ borderColor: "var(--border-default)" }}>
          <span
            className="mt-1.5 size-1.5 shrink-0 rounded-full"
            style={{ background: typeColors[event.type] ?? "var(--gray-400)" }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold" style={{ color: typeColors[event.type] ?? "var(--gray-400)" }}>
                {event.type.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="truncate font-mono text-[10px]" style={{ color: "var(--gray-500)" }}>
              {event.data.caller ? `${String(event.data.caller)} · ` : ""}
              {event.data.query ? `"${String(event.data.query).slice(0, 50)}"` : ""}
              {event.data.credits ? ` · ${String(event.data.credits)}cr` : ""}
              {event.data.durationMs ? ` · ${(Number(event.data.durationMs) / 1000).toFixed(1)}s` : ""}
              {event.data.error ? String(event.data.error) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────
export function ResearchPage() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("standard");
  const [provider, setProvider] = useState<AIProvider | "auto">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState<ResearchDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(true);
  const events = useSSE();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [toolSettings, setToolSettings] = useState<ToolSettings>(() => loadToolSettings());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(decodeURIComponent(q));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-request": "true",
        },
        body: JSON.stringify({
          query: query.trim(),
          depth,
          ...(provider !== "auto" ? { provider } : {}),
          searchTool: toolSettings.researcher.search,
          scrapeTool: toolSettings.researcher.scrape,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Research request failed");
      }

      setDocument(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--bg-base)" }}>
      <Nav />

      {/* Main content — stacked on mobile, side-by-side on lg+ */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden pt-14">

        {/* LEFT PANE: Input + Event Log */}
        <div
          className="flex w-full lg:w-[420px] shrink-0 flex-col border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "var(--border-default)", background: "var(--bg-base)" }}
        >
          {/* Input area */}
          <div className="flex flex-col border-b p-4" style={{ borderColor: "var(--border-default)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Depth selector */}
              <div className="flex gap-1.5">
                {(Object.entries(DEPTH_CONFIG) as [ResearchDepth, typeof DEPTH_CONFIG.quick][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDepth(key)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-center transition-all duration-150"
                    style={{
                      background: depth === key ? "rgba(201, 125, 78, 0.10)" : "transparent",
                      border: `1px solid ${depth === key ? "rgba(201, 125, 78, 0.20)" : "var(--border-default)"}`,
                      color: depth === key ? "var(--accent-400)" : "var(--gray-400)",
                    }}
                  >
                    <span className="block text-[12px] font-medium">{cfg.label}</span>
                    <span className="block font-mono text-[9px]">{cfg.credits}cr · {cfg.desc.split(",")[1]?.trim()}</span>
                  </button>
                ))}
              </div>

              {/* Provider + Tool settings — compact row */}
              <div className="flex items-center gap-2">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AIProvider | "auto")}
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none transition-all"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: "var(--gray-600)",
                  }}
                >
                  <option value="auto">Auto model</option>
                  <option value="openai">GPT-4o</option>
                  <option value="gemini">Gemini</option>
                  <option value="anthropic">Claude</option>
                </select>
                <ToolSettingsButton onSettingsChange={setToolSettings} />
              </div>

              {/* Text input */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="What would you like to research?"
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 pr-12 text-[13px] leading-relaxed outline-none transition-all"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: "var(--gray-800)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Run button — full width, visually strong */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium text-white transition-all disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                  boxShadow: query.trim() && !isLoading ? "0 0 20px -4px rgba(201,125,78,0.35)" : "none",
                }}
              >
                {isLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> Researching…</>
                ) : (
                  <><Send size={14} /> Run Research</>
                )}
              </button>

              {error && (
                <p className="text-[12px]" style={{ color: "#EF4444" }}>{error}</p>
              )}
            </form>
          </div>

          {/* Status bar */}
          {isLoading && (
            <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "var(--border-default)" }}>
              <Loader2 size={12} className="animate-spin" style={{ color: "var(--accent-400)" }} />
              <span className="text-[12px]" style={{ color: "var(--accent-400)" }}>
                Researching… scraping sources and generating document
              </span>
            </div>
          )}

          {/* Event log toggle */}
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="flex items-center gap-2 border-b px-4 py-2 transition-colors"
            style={{ borderColor: "var(--border-default)" }}
          >
            <ChevronRight
              size={12}
              style={{ color: "var(--gray-400)", transform: showEventLog ? "rotate(90deg)" : "none", transition: "transform 150ms" }}
            />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Live Event Log
            </span>
            {events.length > 0 && (
              <span className="ml-auto flex items-center gap-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: "var(--green-400)" }} />
                  <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--green-400)" }}>
                  {events.length}
                </span>
              </span>
            )}
          </button>

          {/* Event log content */}
          {showEventLog && (
            <div className="flex-1 overflow-hidden">
              <EventLogPanel events={events} />
            </div>
          )}

          {/* Quick stats at bottom */}
          <div className="flex items-center gap-4 border-t px-4 py-2.5" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-1.5">
              <Globe size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {document ? `${document.sources.length} sources` : "0 sources"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {document ? `${(document.durationMs / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {document ? `${document.creditsUsed}cr` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Document output */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-[50vh] lg:min-h-0">
          {document ? <DocumentView doc={document} /> : <EmptyState />}
        </div>
      </div>
    </div>
  );
}
