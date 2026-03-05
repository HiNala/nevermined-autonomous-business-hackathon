"use client";

import { useState } from "react";
import { Settings, X, Search, FileText, Bot, Cpu } from "lucide-react";
import {
  loadToolSettings,
  saveToolSettings,
  DEFAULT_TOOL_SETTINGS,
  type ToolSettings,
  type SearchProvider,
  type ScrapeProvider,
} from "@/lib/tool-settings";

interface ToolSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: ToolSettings) => void;
}

const SEARCH_OPTIONS: { value: SearchProvider; label: string; description: string }[] = [
  { value: "exa", label: "Exa", description: "Neural search with inline content" },
  { value: "apify", label: "Apify", description: "Google Search via scraper actor" },
  { value: "duckduckgo", label: "DuckDuckGo", description: "Free fallback (no key needed)" },
];

const SCRAPE_OPTIONS: { value: ScrapeProvider; label: string; description: string }[] = [
  { value: "exa", label: "Exa", description: "Clean text via getContents API" },
  { value: "apify", label: "Apify", description: "Website Content Crawler actor" },
  { value: "raw", label: "Raw Fetch", description: "Basic HTTP + HTML stripping" },
];

function ProviderSelect<T extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: typeof Search;
  value: T;
  options: { value: T; label: string; description: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: "var(--gray-400)" }} />
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all"
            style={{
              background: value === opt.value ? "rgba(34, 197, 94, 0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${value === opt.value ? "rgba(34, 197, 94, 0.25)" : "var(--border-default)"}`,
            }}
          >
            <div
              className="flex size-4 shrink-0 items-center justify-center rounded-full"
              style={{
                border: `2px solid ${value === opt.value ? "rgb(34, 197, 94)" : "var(--gray-600)"}`,
                background: value === opt.value ? "rgb(34, 197, 94)" : "transparent",
              }}
            >
              {value === opt.value && (
                <div className="size-1.5 rounded-full" style={{ background: "var(--bg-base)" }} />
              )}
            </div>
            <div>
              <div className="text-[12px] font-medium" style={{ color: value === opt.value ? "var(--gray-700)" : "var(--gray-500)" }}>
                {opt.label}
              </div>
              <div className="text-[10px]" style={{ color: "var(--gray-400)" }}>
                {opt.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToolSettingsPanel({ open, onClose, onSettingsChange }: ToolSettingsPanelProps) {
  const [settings, setSettings] = useState<ToolSettings>(() => loadToolSettings());

  function update(next: ToolSettings) {
    setSettings(next);
    saveToolSettings(next);
    onSettingsChange?.(next);
  }

  function resetDefaults() {
    update(DEFAULT_TOOL_SETTINGS);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col"
        style={{ background: "var(--bg-base)", borderLeft: "1px solid var(--border-default)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} style={{ color: "var(--gray-500)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--gray-700)" }}>
              Agent Tool Settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-opacity hover:opacity-60"
            style={{ color: "var(--gray-400)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-5 text-[11px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
            Configure which tools each agent uses for web search and content extraction.
            Settings are saved locally and sent with each request.
          </p>

          {/* Strategist */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex size-6 items-center justify-center rounded-md"
                style={{ background: "rgba(201, 125, 78, 0.1)", border: "1px solid rgba(201, 125, 78, 0.2)" }}
              >
                <Bot size={12} style={{ color: "rgb(99, 102, 241)" }} />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: "var(--gray-600)" }}>
                Strategist Agent
              </span>
            </div>
            <div className="space-y-3 pl-8">
              <ProviderSelect
                label="Search Engine"
                icon={Search}
                value={settings.strategist.search}
                options={SEARCH_OPTIONS}
                onChange={(v) => update({ ...settings, strategist: { ...settings.strategist, search: v } })}
              />
              <ProviderSelect
                label="Content Extraction"
                icon={FileText}
                value={settings.strategist.scrape}
                options={SCRAPE_OPTIONS}
                onChange={(v) => update({ ...settings, strategist: { ...settings.strategist, scrape: v } })}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 border-t" style={{ borderColor: "var(--border-default)" }} />

          {/* Researcher */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex size-6 items-center justify-center rounded-md"
                style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}
              >
                <Cpu size={12} style={{ color: "rgb(34, 197, 94)" }} />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: "var(--gray-600)" }}>
                Researcher Agent
              </span>
            </div>
            <div className="space-y-3 pl-8">
              <ProviderSelect
                label="Search Engine"
                icon={Search}
                value={settings.researcher.search}
                options={SEARCH_OPTIONS}
                onChange={(v) => update({ ...settings, researcher: { ...settings.researcher, search: v } })}
              />
              <ProviderSelect
                label="Content Extraction"
                icon={FileText}
                value={settings.researcher.scrape}
                options={SCRAPE_OPTIONS}
                onChange={(v) => update({ ...settings, researcher: { ...settings.researcher, scrape: v } })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-5 py-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <button
            onClick={resetDefaults}
            className="text-[11px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--gray-400)" }}
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              color: "rgb(34, 197, 94)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

/** Small gear button that opens the settings panel. */
export function ToolSettingsButton({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ToolSettings) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-default)",
          color: "var(--gray-400)",
        }}
        title="Agent Tool Settings"
      >
        <Settings size={12} />
        Tools
      </button>
      <ToolSettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}
