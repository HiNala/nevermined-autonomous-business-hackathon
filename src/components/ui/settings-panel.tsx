"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  ToolSettings,
  TradingSettings,
  SearchProvider,
  ScrapeProvider,
  AgentToolSettings,
} from "@/lib/tool-settings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceStatus {
  exa: boolean;
  apify: boolean;
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
  zeroclick: boolean;
  nevermined: boolean;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: ToolSettings;
  onChange: (settings: ToolSettings) => void;
}

// ─── Toggle Group ─────────────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  status,
}: {
  label: string;
  options: {
    value: T;
    label: string;
    note: string;
    needsKey: keyof ServiceStatus | null;
  }[];
  value: T;
  onChange: (v: T) => void;
  status: ServiceStatus | null;
}) {
  return (
    <div>
      <p
        className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--gray-400)" }}
      >
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const configured = opt.needsKey
            ? (status?.[opt.needsKey] ?? false)
            : true;
          const isActive = value === opt.value;

          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all"
              style={{
                background: isActive
                  ? "rgba(201, 125, 78, 0.07)"
                  : "var(--bg-surface)",
                border: `1px solid ${
                  isActive
                    ? "rgba(201, 125, 78, 0.25)"
                    : "var(--border-default)"
                }`,
              }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isActive ? "var(--accent-400)" : "var(--gray-400)",
                  }}
                >
                  {isActive && (
                    <div
                      className="size-1.5 rounded-full"
                      style={{ background: "var(--accent-400)" }}
                    />
                  )}
                </div>
                <div>
                  <p
                    className="text-[12px] font-medium leading-tight"
                    style={{
                      color: isActive ? "var(--gray-700)" : "var(--gray-500)",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="mt-0.5 text-[10px] leading-tight"
                    style={{ color: "var(--gray-400)" }}
                  >
                    {opt.note}
                  </p>
                </div>
              </div>
              <div
                className="ml-3 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5"
                style={{
                  background: configured
                    ? "rgba(34, 197, 94, 0.07)"
                    : "var(--bg-surface)",
                  border: `1px solid ${
                    configured
                      ? "rgba(34, 197, 94, 0.15)"
                      : "var(--border-default)"
                  }`,
                }}
              >
                <div
                  className="size-1 rounded-full"
                  style={{
                    background: configured ? "#22C55E" : "var(--gray-400)",
                  }}
                />
                <span
                  className="font-mono text-[8px]"
                  style={{
                    color: configured ? "#22C55E" : "var(--gray-400)",
                  }}
                >
                  {configured ? "ready" : "no key"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agent Section ────────────────────────────────────────────────────────────

function AgentSection({
  title,
  subtitle,
  accentColor,
  tools,
  onChange,
  status,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  tools: AgentToolSettings;
  onChange: (t: AgentToolSettings) => void;
  status: ServiceStatus | null;
}) {
  const searchOptions: {
    value: SearchProvider;
    label: string;
    note: string;
    needsKey: keyof ServiceStatus | null;
  }[] = [
    {
      value: "exa",
      label: "Exa",
      note: "Neural search · returns full page content inline",
      needsKey: "exa",
    },
    {
      value: "apify",
      label: "Apify",
      note: "Google Search via Apify Actor",
      needsKey: "apify",
    },
    {
      value: "duckduckgo",
      label: "DuckDuckGo",
      note: "Free fallback · no API key needed",
      needsKey: null,
    },
  ];

  const scrapeOptions: {
    value: ScrapeProvider;
    label: string;
    note: string;
    needsKey: keyof ServiceStatus | null;
  }[] = [
    {
      value: "exa",
      label: "Exa getContents",
      note: "Clean text extraction for given URLs",
      needsKey: "exa",
    },
    {
      value: "apify",
      label: "Apify Crawler",
      note: "Website Content Crawler · returns Markdown",
      needsKey: "apify",
    },
    {
      value: "raw",
      label: "Raw HTML",
      note: "Basic fetch + HTML strip · no key needed",
      needsKey: null,
    },
  ];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="mb-4">
        <div className="mb-0.5 flex items-center gap-2">
          <div
            className="size-2 rounded-full"
            style={{ background: accentColor }}
          />
          <p
            className="text-[13px] font-semibold"
            style={{ color: "var(--gray-700)" }}
          >
            {title}
          </p>
        </div>
        <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
          {subtitle}
        </p>
      </div>
      <div className="space-y-4">
        <ToggleGroup
          label="Search Engine"
          options={searchOptions}
          value={tools.search}
          onChange={(v) => onChange({ ...tools, search: v })}
          status={status}
        />
        <ToggleGroup
          label="Content Scraper"
          options={scrapeOptions}
          value={tools.scrape}
          onChange={(v) => onChange({ ...tools, scrape: v })}
          status={status}
        />
      </div>
    </div>
  );
}

// ─── Trading Toggles ─────────────────────────────────────────────────────────

function TradingToggle({
  label,
  description,
  enabled,
  onChange,
  accentColor,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-all"
      style={{
        background: enabled ? "rgba(201, 125, 78, 0.05)" : "var(--bg-surface)",
        border: `1px solid ${enabled ? "rgba(201, 125, 78, 0.20)" : "var(--border-default)"}`,
      }}
    >
      <div className="min-w-0 flex-1 pr-3">
        <p
          className="text-[12px] font-medium leading-tight"
          style={{ color: enabled ? "var(--gray-700)" : "var(--gray-500)" }}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
          {description}
        </p>
      </div>
      <div
        className="relative flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors"
        style={{
          background: enabled ? accentColor : "var(--gray-300)",
        }}
      >
        <div
          className="absolute size-[16px] rounded-full bg-white shadow-sm transition-all"
          style={{ left: enabled ? "17px" : "2px" }}
        />
      </div>
    </button>
  );
}

function TradingSection({
  trading,
  onChange,
}: {
  trading: TradingSettings;
  onChange: (t: TradingSettings) => void;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="mb-4">
        <div className="mb-0.5 flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ background: "#F59E0B" }} />
          <p className="text-[13px] font-semibold" style={{ color: "var(--gray-700)" }}>
            Agent Trading
          </p>
        </div>
        <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
          Control how agents buy and sell outputs from each other
        </p>
      </div>
      <div className="space-y-2">
        <TradingToggle
          label="Internal Trading"
          description="Interpreter → Composer → Seller credit accounting. When ON, each agent charges credits for its work using IncomingOrder/ComposedReport contracts. Turn OFF to run the pipeline without internal billing."
          enabled={trading.internalTrading}
          onChange={(v) => onChange({ ...trading, internalTrading: v })}
          accentColor="#22C55E"
        />
        <TradingToggle
          label="External Marketplace"
          description="Buyer agent discovers and purchases outputs from third-party agents on the Nevermined marketplace. Keep OFF for UI demos — turn ON only for agentic/live procurement flows where real x402 payments can be transacted."
          enabled={trading.externalTrading}
          onChange={(v) => onChange({ ...trading, externalTrading: v })}
          accentColor="#F59E0B"
        />
        {!trading.externalTrading && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}
          >
            <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold" style={{ color: "#6366F1" }}>DEMO</span>
            <p className="text-[10px] leading-snug" style={{ color: "#6366F1" }}>
              Demo-safe mode active. Seller will plan enrichment but the Buyer will not transact. Ideal for judges and internal demos.
            </p>
          </div>
        )}
        <TradingToggle
          label="Seller Agent"
          description="The Seller is the commerce and delivery layer — it owns intake (IncomingOrder), job lifecycle, enrichment decisions, quality gate, and final packaging. Disabling returns 503 to external callers."
          enabled={trading.sellerEnabled}
          onChange={(v) => onChange({ ...trading, sellerEnabled: v })}
          accentColor="#EF4444"
        />
        <TradingToggle
          label="Nevermined Tracking"
          description="Log internal pipeline runs to the Nevermined network for auditability. External x402 payments (A2A buyer orders) always log regardless — this only controls internal Studio/Store runs."
          enabled={trading.nvmTracking}
          onChange={(v) => onChange({ ...trading, nvmTracking: v })}
          accentColor="#8B5CF6"
        />
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  onClose,
  settings,
  onChange,
}: SettingsPanelProps) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ServiceStatus | null) => {
        if (d) setStatus(d);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const statusEntries: {
    key: keyof ServiceStatus;
    label: string;
    note: string;
  }[] = [
    { key: "exa", label: "EXA_API_KEY", note: "Neural search" },
    { key: "apify", label: "APIFY_API_TOKEN", note: "Google Search + scraping" },
    { key: "openai", label: "OPENAI_API_KEY", note: "GPT-4o" },
    { key: "gemini", label: "GOOGLE_AI_KEY", note: "Gemini" },
    { key: "anthropic", label: "ANTHROPIC_API_KEY", note: "Claude" },
    { key: "zeroclick", label: "ZEROCLICK_API_KEY", note: "In-chat ads" },
    { key: "nevermined", label: "NVM_API_KEY", note: "Payments" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col overflow-hidden"
        style={{
          background: "var(--bg-base)",
          borderLeft: "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h2
              className="text-[14px] font-semibold"
              style={{ color: "var(--gray-800)" }}
            >
              Tool Settings
            </h2>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: "var(--gray-400)" }}
            >
              Configure tools &amp; capabilities for all four agents
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--gray-400)" }}
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <AgentSection
            title="Interpreter Agent"
            subtitle="Structures incoming requests into precise execution briefs"
            accentColor="#7C3AED"
            tools={settings.strategist}
            onChange={(t) => onChange({ ...settings, strategist: t })}
            status={status}
          />

          <AgentSection
            title="Composer Agent"
            subtitle="Searches the web and composes the final research report"
            accentColor="#0EA5E9"
            tools={settings.researcher}
            onChange={(t) => onChange({ ...settings, researcher: t })}
            status={status}
          />

          <AgentSection
            title="Buyer Agent"
            subtitle="Procures third-party assets from Nevermined marketplace"
            accentColor="#F59E0B"
            tools={settings.buyer}
            onChange={(t) => onChange({ ...settings, buyer: t })}
            status={status}
          />

          <AgentSection
            title="Seller Agent"
            subtitle="Intake, orchestration, quality gate, and final delivery"
            accentColor="#EF4444"
            tools={settings.seller}
            onChange={(t) => onChange({ ...settings, seller: t })}
            status={status}
          />

          <TradingSection
            trading={settings.trading}
            onChange={(t) => onChange({ ...settings, trading: t })}
          />

          {/* API Key Status */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p
              className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--gray-400)" }}
            >
              API Key Status
            </p>

            {status ? (
              <div className="space-y-2">
                {statusEntries.map(({ key, label, note }) => {
                  const ok = status[key];
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: "var(--gray-500)" }}
                        >
                          {label}
                        </span>
                        <span
                          className="ml-1.5 text-[10px]"
                          style={{ color: "var(--gray-400)" }}
                        >
                          — {note}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 rounded-full px-2 py-0.5"
                        style={{
                          background: ok
                            ? "rgba(34, 197, 94, 0.07)"
                            : "var(--bg-surface)",
                          border: `1px solid ${
                            ok
                              ? "rgba(34, 197, 94, 0.2)"
                              : "var(--border-default)"
                          }`,
                        }}
                      >
                        <div
                          className="size-1.5 rounded-full"
                          style={{
                            background: ok ? "#22C55E" : "var(--gray-400)",
                          }}
                        />
                        <span
                          className="font-mono text-[8px]"
                          style={{
                            color: ok ? "#22C55E" : "var(--gray-400)",
                          }}
                        >
                          {ok ? "set" : "missing"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div
                  className="size-2 animate-pulse rounded-full"
                  style={{ background: "var(--gray-400)" }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: "var(--gray-400)" }}
                >
                  Loading status…
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
